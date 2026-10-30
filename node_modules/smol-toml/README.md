# smol-toml
[![TOML 1.1.0](https://img.shields.io/badge/TOML-1.1.0-9c4221?style=flat-square)](https://toml.io/en/v1.1.0)
[![License](https://img.shields.io/github/license/squirrelchat/smol-toml.svg?style=flat-square)](https://github.com/squirrelchat/smol-toml/blob/mistress/LICENSE)
[![npm](https://img.shields.io/npm/v/smol-toml?style=flat-square)](https://npmx.dev/smol-toml)
[![Build](https://img.shields.io/github/actions/workflow/status/squirrelchat/smol-toml/build.yaml?style=flat-square&logo=github)](https://github.com/squirrelchat/smol-toml/actions/workflows/build.yaml)

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-support%20me-EA4AAA?style=flat-square)](https://github.com/sponsors/cyyynthia)
[![Weekly downloads](https://img.shields.io/npm/dw/smol-toml?style=flat-square)](https://npmx.dev/smol-toml)
[![Monthly downloads](https://img.shields.io/npm/dm/smol-toml?style=flat-square)](https://npmx.dev/smol-toml)

A small, fast, and correct TOML parser and serializer. smol-toml is fully spec-compliant with TOML v1.1.0, passing
all[^toml-test-asterisk] tests from the [official `toml-test` suite](https://github.com/toml-lang/toml-test).

[^toml-test-asterisk]: By default, certain invalid datetimes (e.g. `2020-02-30`) are gracefully accepted. Due to
JavaScript's lax handling of Unicode, some invalid byte sequences are accepted. Requires using the `integersAsBigInt`
option for full type preservation. Use the `run-toml-test.bash` script to run the tests.

> [!IMPORTANT]
> - By default, the behaviour regarding integers doesn't preserve type information, nor does it allow deserializing
>   integers larger than 53 bits. See [Integers](#integers).
> - The library currently uses the legacy `Date` object by default. See [Date, Time, and Datetime](#date-time-and-datetime).

## Usage

```js
import { parse, stringify } from 'smol-toml'

const doc = '...'
const parsed = parse(doc)
console.log(parsed)

const toml = stringify(parsed)
console.log(toml)
```

Alternatively, if you prefer something similar to the JSON global, you can import the library as follows
```js
import * as TOML from 'smol-toml'

TOML.stringify({ ... })
```

A few notes on the `stringify` function:
- `undefined` and `null` values on objects are ignored (they do not produce a key/value).
- `undefined` and `null` values in arrays are **rejected**.
- Functions, classes and symbols are **rejected**.
- By default, floats will be serialized as integers if they don't have a decimal part.
  - i.e. `stringify(parse('a = 1.0'))` will produce `a = 1`, despite the source value being a float.
  - See [Integers](#integers) for end-to-end type preservation using `BigInt`.
- JS `Date` will be serialized as an Offset Date-Time in UTC.
  - Use the [Temporal API] for representing other types (or alternatively the legacy [`TomlDate` object](#tomldate-object)).

### Options

Both `parse` and `stringify` accept an options object as 2nd argument.

#### Parse options

| Option               | Type                          | Default  | Description                                                                                                     | Introduced in |
|----------------------|-------------------------------|----------|-----------------------------------------------------------------------------------------------------------------|---------------|
| `integersAsBigInt`   | `boolean \| 'asNeeded'`       | `false`  | Parse integers as `BigInt`. See [Integers](#integers).                                                          | 1.4.0         |
| `useLegacyDate`      | `boolean`                     | `true`   | Use the legacy `TomlDate` instead of the Temporal API. See [Date, Time, and Datetime](#date-time-and-datetime). | 1.9.0         |
| `unsafeKeyBehaviour` | `'keep' \| 'drop' \| 'throw'` | `'keep'` | Reject potentially dangerous keys such as `__proto__` or `constructor`. See [Key safety](#key-safety).          | 1.9.0         |

##### Key safety

Internally, `smol-toml` is protected against prototype pollution and will correctly assign a plain property named e.g.
`__proto__` on the object, similar to what JavaScript-native `JSON.parse` does.

However, careless use of the object returned by the parser in your application code may lead to prototype pollution.
This is for instance the case in this example taken from Fastify's `secure-json-parse` helper which exists to address
this caveat.

```js
import { parse } from 'smol-toml'

const a = parse('__proto__.b = 5')
console.log(a.b) // ~> undefined

const b = Object.assign({}, a)
console.log(b.b) // ~> 5
```

Similarly to `secure-json-parse`, the library offers 3 modes to deal with these keys:
- `keep` (default): preserve potentially unsafe properties and return the object as-is.
- `drop`: silently drop potentially unsafe properties, returning the object as if the properties were not there.
- `throw`: reject documents with potentially unsafe properties and throw a `TomlError`.

#### Stringify options

| Option           | Type      | Default    | Description                                                                                                                    | Introduced in |
|------------------|-----------|------------|--------------------------------------------------------------------------------------------------------------------------------|---------------|
| `numbersAsFloat` | `boolean` | `false`    | Always render plain numbers as floating point values. See [Type preservation](#type-preservation).                             | 1.4.0         |
| `strictTemporal` | `boolean` | `false`    | Reject Temporal values with an IANA timezone or a calendar. See [IANA timezones and calendars](#iana-timezones-and-calendars). | 1.9.0         |

## Dealing with values

### Integers

When parsing, both integers and floats are parsed as plain JavaScript numbers by default, which are double-precision
floating point numbers. That means that the library does not preserve type information between e.g. `1.0` and `1`, and
that it is not able to parse integers beyond 53 bits.

While this is sufficient for the vast majority of use-cases, if support of larger integers is needed, it is possible
to [enable BigInt support](#enabling-bigint).

When serializing, numbers without a decimal part are serialized as integers (except if they're outside of the safe
range; i.e. they cannot be represented as a signed 53-bit integer). This is generally a good enough heuristic for most
usages, but it is possible to leverage BigInts for [full type preservation](#type-preservation).

#### Enabling BigInt

To parse integers beyond 53 bits, it's possible to tell the parser to return all integers as BigInt. This will
therefore preserve the type information at the cost of using a more expensive container (approx. 5% slowdown).

```js
import { parse } from 'smol-toml'

const doc = '...'
const parsed = parse(doc, { integersAsBigInt: true })
```

If you want to only use BigInt for numbers that cannot safely be represented as plain JavaScript numbers, you can pass
`"asNeeded"` instead.

##### Type preservation

To get end-to-end type preservation, you can tell the serializer to always treat numbers as floating point numbers.
Then, only BigInts will be serialized as integers and numbers without a decimal part will still be serialized as float.

```js
import { stringify } from 'smol-toml'

const obj =  { ... }
const toml = stringify(obj, { numbersAsFloat: true })
```

### Date, Time, and Datetime

`smol-toml` can emit time-related types in 2 ways: the modern [Temporal API], or the legacy (_but currently default_)
`Date` object, using a custom [`TomlDate` object](#tomldate-object).

> [!NOTE]
> While `TomlDate` is 2-3x faster than Temporal in microbenchmarks, the performance difference in practice on parse
> time is insignificant (or even slower[^temporal-slow-or-fast]) for `smol-toml`. See the [benchmarks](#benchmarks).
>
> `TomlDate` is limited to millisecond precision and has a more lax behaviour. It gracefully accepts certain invalid
> inputs, such as "the 30th of February", converting it to the 2nd (or 1st) of March. The Temporal implementation is
> stricter and properly rejects these invalid dates.
>
> The next major version of the library will use Temporal by default.

[^temporal-slow-or-fast]: The `Temporal` implementation dispatches more instructions to the CPU; however, it is much
                          more friendly to the branch predictor. At the microarchitecture level, this allows the CPU
                          to reach a higher number of _instructions per clock_, which results in a net positive
                          performance impact. The CPU has to do _more_, but it can do it _faster_.

The different TOML types and Temporal types are mapped as described below.

#### TOML type to Temporal mapping

| TOML type                                                      | Temporal type              |
|----------------------------------------------------------------|----------------------------|
| [Offset Date-Time](https://toml.io/en/v1.1.0#offset-date-time) | [`Temporal.ZonedDateTime`] |
| [Local Date-Time](https://toml.io/en/v1.1.0#local-date-time)   | [`Temporal.PlainDateTime`] |
| [Local Date](https://toml.io/en/v1.1.0#local-date)             | [`Temporal.PlainDate`]     |
| [Local Time](https://toml.io/en/v1.1.0#local-time)             | [`Temporal.PlainTime`]     |

#### Temporal to TOML type mapping

| Temporal type               | TOML type                                                      | Notes                                                                            |
|-----------------------------|----------------------------------------------------------------|----------------------------------------------------------------------------------|
| [`Temporal.Duration`]       | **Unsupported** (throws)                                       | There is an ongoing [feature request][toml-lang/toml#514] and an [active proposal][toml-lang/toml#1105]. Note that the current draft does not allow multi-part values (e.g. `1min 20sec`), making it likely that `Duration` will not always be convertible to a TOML value. |
| [`Temporal.Instant`]        | [Offset Date-Time](https://toml.io/en/v1.1.0#offset-date-time) | Always in UTC.                                                                    |
| [`Temporal.PlainDate`]      | [Local Date](https://toml.io/en/v1.1.0#local-date)             | Calendar info lost, [see below](#iana-timezones-and-calendars).                   |
| [`Temporal.PlainDateTime`]  | [Local Date-Time](https://toml.io/en/v1.1.0#local-date-time)   | Calendar info lost, [see below](#iana-timezones-and-calendars).                   |
| [`Temporal.PlainMonthDay`]  | **Unsupported** (throws)                                       |                                                                                   |
| [`Temporal.PlainTime`]      | [Local Time](https://toml.io/en/v1.1.0#local-time)             |                                                                                   |
| [`Temporal.PlainYearMonth`] | **Unsupported** (throws)                                       |                                                                                   |
| [`Temporal.ZonedDateTime`]  | [Offset Date-Time](https://toml.io/en/v1.1.0#offset-date-time) | IANA timezone and calendar info lost, [see below](#iana-timezones-and-calendars). |

##### IANA timezones and calendars

`ZonedDateTime` objects may have 2 different types of timezone identifier attached to them: either an offset such as
`+02:00`, or an [IANA Time Zone Identifier](https://www.iana.org/time-zones) such as `Europe/Paris`. The latter carries
information about the currently observed offset in that region, daylight savings policies, and other timekeeping quirks
such as leap seconds. It is a much more precise information than the offset alone. Additionally, `ZonedDateTime` allows
keeping track of a specific calendar to use, such as for example the *Japanese imperial era*.

TOML can only represent offsets, not precise timezones nor a calendar[^tz-request]. As such, when serializing a
`ZonedDateTime`, this information is **lost** and only the offset is preserved; effectively treating the `ZonedDateTime`
as if it were an `Instant`. To prevent silent loss of timezone information, the `strictTemporal` option can be
enabled to throw an error instead. Timezones that aren't simple offsets, or objects using a calendar that isn't
the default ISO 8601 will be rejected.

[^tz-request]: There was a request to support the [RFC 9557] syntax, but it has been rejected. See [toml-lang/toml#1034].

#### TomlDate object
> [!NOTE]
> This object is not formally deprecated yet, but it is a legacy API. It will be deprecated in v2 and removed in v3.

The object directly inherits the JavaScript `Date` object, with a handful of extra APIs for distinguishing between
different types of time components.

`TomlDate` preserves the offset, whereas the native `Date` object usually normalises everything to UTC.

> [!CAUTION]
> Unlike the [Temporal API] which supports nanosecond precision, `Date` is limited to millisecond precision.

```js
import { TomlDate } from 'smol-toml'

// Offset Date Time
const date = new TomlDate('1979-05-27T07:32:00.000-08:00')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> true, false, false, false
console.log(date.toISOString()) // ~> 1979-05-27T07:32:00.000-08:00

// Local Date Time
const date = new TomlDate('1979-05-27T07:32:00.000')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> true, false, false, true
console.log(date.toISOString()) // ~> 1979-05-27T07:32:00.000

// Local Date
const date = new TomlDate('1979-05-27')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> false, true, false, true
console.log(date.toISOString()) // ~> 1979-05-27

// Local Time
const date = new TomlDate('07:32:00')
console.log(date.isDateTime(), date.isDate(), date.isTime(), date.isLocal()) // ~> false, false, true, true
console.log(date.toISOString()) // ~> 07:32:00.000
```

You can also wrap a native `Date` object and specify using different methods depending on the type of date you wish
to represent:

```js
import { TomlDate } from 'smol-toml'

const jsDate = new Date()

const offsetDateTime = TomlDate.wrapAsOffsetDateTime(jsDate)
const localDateTime = TomlDate.wrapAsLocalDateTime(jsDate)
const localDate = TomlDate.wrapAsLocalDate(jsDate)
const localTime = TomlDate.wrapAsLocalTime(jsDate)
```

## Performance
The benchmark is ran using [mitata](https://github.com/evanwashere/mitata). See the sources in `bench`.

> [!NOTE]
> - The output of `smol-toml` with Temporal *disabled* is used as the starting value for stringify benchmarks.
> - The TOML generator used to create the 5MB test file can be found [here](https://gist.github.com/cyyynthia/e77c744cb6494dabe37d0182506526b9).

### Results
- [Parse, spec example](#parse-spec-example)
- [Parse, 5MB randomly generated file](#parse-5mb-randomly-generated)
- [Stringify, spec example](#parse-spec-example)
- [Stringify, 5MB randomly generated file](#parse-5mb-randomly-generated)

#### Parse, spec example

|    | Library                                  | Performance   | Slowdown | Notes |
|:--:|------------------------------------------|---------------|----------|-------|
| 🥇  | smol-toml@1.9.0 (Date)                   | 2.98 µs/iter  | 1x       | |
| 🥈  | smol-toml@1.9.0 (Temporal)               | 3.14 µs/iter  | 1.06x    | |
| 🥉  | fast-toml@0.5.4                          | 5.13 µs/iter  | 1.72x    | Unmaintained. No handling of special floats. Bad handling of some unicode escapes. Parses `nan` as `false`. |
| 4  | @iarna/toml@3.0.0                        | 12.66 µs/iter | 4.25x    | Unmaintained. Has defects in datetime parsing. Uses `eval`. |
| 5  | @decimalturn/toml-patch@3.1.2 (Date)     | 19.60 µs/iter | 6.58x    | Special-purpose: designed for non-destructive document edition. |
| 6  | @decimalturn/toml-patch@3.1.2 (Temporal) | 20.98 µs/iter | 7.04x    | Special-purpose: designed for non-destructive document edition. |
| 7  | @std/toml@1.0.11                         | 22.81 µs/iter | 7.66x    | |
| 8  | js-toml@2.0.1                            | 23.00 µs/iter | 7.72x    | |
| 9  | @ltd/j-toml@1.38.0                       | 31.25 µs/iter | 10.49x   | Unmaintained. Has defects in number parsing when disabling `bigint`. |
| 10 | toml@5.0.0 (Temporal)                    | 33.04 µs/iter | 11.09x   | |
| 11 | toml@5.0.0 (Date/string)                 | 33.20 µs/iter | 11.15x   | |

#### Parse, 5MB randomly generated file

|    | Library                                  | Performance    | Slowdown | Notes |
|:--:|------------------------------------------|----------------|----------|-------|
| 🥇  | smol-toml@1.9.0 (Temporal)               | 45.05 ms/iter  | 1x       | |
| 🥈  | smol-toml@1.9.0 (Date)                   | 47.71 ms/iter  | 1.06x    | |
| 🥉  | fast-toml@0.5.4                          | 92.50 ms/iter  | 2.05x    | Unmaintained. No handling of special floats. Bad handling of some unicode escapes. Parses `nan` as `false`. |
| 4  | @ltd/j-toml@1.38.0                       | 186.47 ms/iter | 4.14x    | Unmaintained. Has defects in number parsing when disabling `bigint`. |
| 5  | @decimalturn/toml-patch@3.1.2 (Date)     | 207.09 ms/iter | 4.6x     | Special-purpose: designed for non-destructive document edition. |
| 6  | @decimalturn/toml-patch@3.1.2 (Temporal) | 219.53 ms/iter | 4.87x    | Special-purpose: designed for non-destructive document edition. |
| 7  | js-toml@2.0.1                            | 280.63 ms/iter | 6.23x    | |
| 8  | @std/toml@1.0.11                         | 428.34 ms/iter | 9.51x    | |
| 9  | toml@5.0.0 (Date/string)                 | 557.91 ms/iter | 12.38x   | |
| 10 | toml@5.0.0 (Temporal)                    | 587.43 ms/iter | 13.04x   | |
| -  | @iarna/toml@3.0.0                        | **DNF**        | **DNF**  | Unmaintained. Has defects in datetime parsing. Uses `eval`. |

#### Stringify, spec example

|   | Library                       | Performance   | Slowdown | Notes |
|:-:|-------------------------------|---------------|----------|-------|
| 🥇 | smol-toml@1.9.0               | 2.68 µs/iter  | 1x       | |
| 🥈 | @std/toml@1.0.11              | 4.86 µs/iter  | 1.81x    | |
| 🥉 | js-toml@2.0.1                 | 5.76 µs/iter  | 2.15x    | |
| 4 | @iarna/toml@3.0.0             | 9.71 µs/iter  | 3.62x    | Unmaintained. |
| 5 | @ltd/j-toml@1.38.0            | 48.15 µs/iter | 17.96x   | Unmaintained. |
| 6 | @decimalturn/toml-patch@3.1.2 | 59.57 µs/iter | 22.22x   | Special-purpose: designed for non-destructive document edition. |

#### Stringify, 5MB randomly generated file

|   | Library                       | Performance    | Slowdown | Notes |
|:-:|-------------------------------|----------------|----------|-------|
| 🥇 | smol-toml@1.9.0               | 43.72 ms/iter  | 1x       | |
| 🥈 | @std/toml@1.0.11              | 71.01 ms/iter  | 1.62x    | |
| 🥉 | js-toml@2.0.1                 | 107.22 ms/iter | 2.45x    | |
| 4 | @iarna/toml@3.0.0             | 134.59 ms/iter | 3.08x    | Unmaintained. |
| 5 | @ltd/j-toml@1.38.0            | 383.10 ms/iter | 8.76x    | Unmaintained. |
| 6 | @decimalturn/toml-patch@3.1.2 | 543.69 ms/iter | 12.44x   | Special-purpose: designed for non-destructive document edition. |

### Detailed benchmark data

<details>
<summary>Detailed benchmark data</summary>

```
node --expose-gc bench/parse.bench.ts
clk: ~5.39 GHz
cpu: AMD Ryzen 9 9950X3D 16-Core Processor
runtime: node 26.10.0 (x64-linux)

benchmark                         avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------------- -------------------------------
• spec document
------------------------------------------------- -------------------------------
smol-toml (Date)                     2.98 µs/iter   2.93 µs  █
                             (2.81 µs … 98.78 µs)   4.21 µs  █▂
                          (440.00  b … 236.20 kb)  12.70 kb ▁██▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                         4.46 ipc ( 99.06% cache)   16.97 branch misses
               16.79k cycles  74.80k instructions   2.21k c-refs   20.71 c-misses

smol-toml (Temporal)                 3.14 µs/iter   3.16 µs             █
                              (3.10 µs … 3.20 µs)   3.20 µs ▇▇ ▂       ▅█▅▂▂
                          (  4.60 kb …   4.62 kb)   4.61 kb ██▇█▇▁▁▄▄▇▄█████▄▄▇▄▄
                         4.47 ipc ( 99.22% cache)   12.39 branch misses
               17.24k cycles  77.01k instructions   2.32k c-refs   18.12 c-misses

@iarna/toml                         12.66 µs/iter  12.51 µs  █
                           (12.09 µs … 104.09 µs)  16.70 µs  █
                          (192.00  b … 454.46 kb)  24.09 kb ▄██▃▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                         3.87 ipc ( 99.63% cache)   84.59 branch misses
               70.08k cycles 271.21k instructions  11.96k c-refs   44.06 c-misses

@ltd/j-toml                         31.25 µs/iter  30.76 µs   ▄██▂
                           (29.69 µs … 851.32 µs)  34.20 µs   ████
                          (760.00  b … 537.88 kb)  27.54 kb ▁▅████▇▃▂▁▁▂▁▂▁▁▁▁▁▁▁
                         3.35 ipc ( 99.48% cache)  293.85 branch misses
              172.79k cycles 578.79k instructions  31.46k c-refs  165.17 c-misses

fast-toml                            5.13 µs/iter   5.10 µs   █
                             (4.96 µs … 89.84 µs)   6.09 µs  ▃█
                          (400.00  b … 376.82 kb)  12.63 kb ▁██▅▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                         4.49 ipc ( 99.53% cache)   13.42 branch misses
               28.68k cycles 128.90k instructions   3.91k c-refs   18.52 c-misses

@std/toml                           22.81 µs/iter  22.71 µs    █
                           (21.45 µs … 148.45 µs)  29.40 µs    █
                          (120.00  b … 498.46 kb)  64.90 kb ▁▄▇█▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                         3.75 ipc ( 99.54% cache)  105.52 branch misses
              125.75k cycles 471.96k instructions  24.08k c-refs  110.15 c-misses

toml (Date/string)                  33.20 µs/iter  31.60 µs  █
                             (30.38 µs … 3.01 ms)  51.14 µs  █
                          (952.00  b …   1.56 mb) 108.82 kb ▆█▃▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                         3.96 ipc ( 99.06% cache)  181.78 branch misses
              177.03k cycles 700.26k instructions  30.31k c-refs  286.20 c-misses

toml (Temporal)                     33.04 µs/iter  31.76 µs █
                            (31.47 µs … 47.08 µs)  33.37 µs █▂ ▂
                          (  6.40 kb …   8.14 kb)   6.98 kb ██▁█▁▆▁▁▁▁▁▁▁▁▁▁▁▁▁▁▆
                         3.94 ipc ( 99.13% cache)  176.95 branch misses
              177.43k cycles 699.67k instructions  31.56k c-refs  274.71 c-misses

js-toml                             23.00 µs/iter  21.48 µs  █
                             (20.32 µs … 2.18 ms)  32.27 µs  █▆
                          (  0.99 kb …   1.45 mb)  92.46 kb ▂██▃▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                         4.10 ipc ( 98.16% cache)  178.29 branch misses
              122.97k cycles 504.24k instructions  20.34k c-refs  374.28 c-misses

@decimalturn/toml-patch (Date)      19.60 µs/iter  19.09 µs  █
                           (18.53 µs … 841.76 µs)  26.77 µs  █
                          (608.00  b … 607.52 kb)  60.02 kb ▃█▄▂▂▁▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                         3.54 ipc ( 99.33% cache)  104.70 branch misses
              107.96k cycles 382.10k instructions  23.95k c-refs  160.21 c-misses

@decimalturn/toml-patch (Temporal)  20.98 µs/iter  20.24 µs ██ █
                            (20.12 µs … 29.49 µs)  20.51 µs ██▅█▅ ▅  ▅          ▅
                          (  2.55 kb …   4.41 kb)   2.86 kb █████▁█▁▁█▁▁▁▁▁▁▁▁▁▁█
                         3.52 ipc ( 99.29% cache)  106.72 branch misses
              114.13k cycles 401.87k instructions  25.31k c-refs  179.37 c-misses

summary
  smol-toml (Date)
   1.06x faster than smol-toml (Temporal)
   1.72x faster than fast-toml
   4.25x faster than @iarna/toml
   6.58x faster than @decimalturn/toml-patch (Date)
   7.04x faster than @decimalturn/toml-patch (Temporal)
   7.66x faster than @std/toml
   7.72x faster than js-toml
   10.49x faster than @ltd/j-toml
   11.09x faster than toml (Temporal)
   11.15x faster than toml (Date/string)

• 5MB document
------------------------------------------------- -------------------------------
smol-toml (Date)                    47.71 ms/iter  50.08 ms                     █
                            (44.72 ms … 50.16 ms)  50.09 ms                     █
                          ( 27.91 mb …  37.81 mb)  33.32 mb █▁█▁████▁▁▁▁▁▁▁▁▁▁▁██
                         3.05 ipc ( 96.95% cache)   1.95M branch misses
              249.63M cycles 760.48M instructions  23.70M c-refs 723.86k c-misses

smol-toml (Temporal)                45.05 ms/iter  46.17 ms  █
                            (43.04 ms … 47.19 ms)  47.06 ms ▅█ ▅▅    ▅   ▅ ▅▅▅  ▅
                          ( 25.17 mb …  36.61 mb)  31.28 mb ██▁██▁▁▁▁█▁▁▁█▁███▁▁█
                         3.09 ipc ( 97.25% cache)   1.52M branch misses
              244.27M cycles 754.78M instructions  29.60M c-refs 813.69k c-misses

@iarna/toml                        error: Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z at row 5, col 45, pos 569:
4: NfF6LuAerfn5mDPI7Cp 2qsrB4vGmJTyb5jNubOIBYYWrWlAsrw PX93S57gjb5GEhR8qOU5blDQmwfVJTA YvmJ9cE3cUZU NAJQgAbIdpZLhc4lOs4ZhMEWehhZqXCsVD1YP1vN2GEoM2WX''', 1986-05-27T18:36:13Z, -5460, "2ZAV3fYlb23hf7r7QoftVlicWE2iuwp", 4790.2253 ]
5> SzeC4Me8T = [ 5928.9340, 1991-04-28 19:24:24, 7807, -782.4516, 0b1000011111, "YvXRZKBGle9d51sqE90t8hP" ]
                                               ^
6: SLMvBirT.pmpX1D.9PivpfFBo = 2010-09-29

@ltd/j-toml                        186.47 ms/iter 184.10 ms     ██ █
                          (166.25 ms … 284.21 ms) 192.51 ms ▅   ██ █    ▅ ▅  ▅  ▅
                          ( 20.29 mb …  55.50 mb)  33.21 mb █▁▁▁██▁█▁▁▁▁█▁█▁▁█▁▁█
                         2.38 ipc ( 97.97% cache)   3.93M branch misses
                1.04G cycles   2.47G instructions 164.91M c-refs   3.35M c-misses

fast-toml                           92.50 ms/iter  92.90 ms  █   █ █
                           (88.55 ms … 101.67 ms)  97.51 ms ▅█   █ █▅ ▅  ▅      ▅
                          ( 13.48 mb …  34.99 mb)  24.13 mb ██▁▁▁█▁██▁█▁▁█▁▁▁▁▁▁█
                         2.82 ipc ( 98.12% cache)   2.40M branch misses
              516.21M cycles   1.45G instructions  67.12M c-refs   1.26M c-misses

@std/toml                          428.34 ms/iter 434.32 ms      █
                          (410.50 ms … 446.83 ms) 442.42 ms ▅   ▅█   ▅▅  ▅▅▅ ▅  ▅
                          (181.70 mb … 204.21 mb) 194.10 mb █▁▁▁██▁▁▁██▁▁███▁█▁▁█
                         3.08 ipc ( 96.60% cache)   6.52M branch misses
                2.41G cycles   7.42G instructions 243.62M c-refs   8.29M c-misses

toml (Date/string)                 557.91 ms/iter 562.12 ms              █
                          (535.21 ms … 581.06 ms) 577.25 ms              █
                          ( 34.09 mb …  84.96 mb)  64.32 mb █▁█▁▁█▁▁███▁▁█▁▁█▁▁▁█
                         4.17 ipc ( 96.50% cache)   6.35M branch misses
                3.07G cycles  12.80G instructions 237.61M c-refs   8.32M c-misses

toml (Temporal)                    587.43 ms/iter 597.17 ms █
                          (570.22 ms … 607.53 ms) 606.15 ms █      █       █
                          (  2.54 mb …  92.29 mb)  56.92 mb █▁▁█▁▁▁█▁▁▁▁▁███▁▁▁▁█
                         4.08 ipc ( 96.20% cache)   6.59M branch misses
                3.20G cycles  13.03G instructions 261.00M c-refs   9.91M c-misses

js-toml                            280.63 ms/iter 305.16 ms  █
                          (248.43 ms … 358.30 ms) 322.18 ms  █
                          (268.55 mb … 282.47 mb) 272.11 mb ████▁█▁▁▁▁█▁▁▁▁█▁█▁▁█
                         2.17 ipc ( 94.73% cache)   5.06M branch misses
                1.49G cycles   3.23G instructions 127.90M c-refs   6.74M c-misses

@decimalturn/toml-patch (Date)     207.09 ms/iter 212.85 ms   █
                          (195.68 ms … 235.57 ms) 219.92 ms  ██
                          (  5.63 mb …  47.95 mb)  28.68 mb ███▁▁▁▁▁▁▁▁██▁██▁▁▁▁█
                         2.94 ipc ( 97.40% cache)   4.09M branch misses
                1.13G cycles   3.33G instructions 144.65M c-refs   3.77M c-misses

@decimalturn/toml-patch (Temporal) 219.53 ms/iter 217.17 ms ██
                          (214.02 ms … 236.49 ms) 233.70 ms ███
                          ( 11.24 mb …  56.44 mb)  25.17 mb ████▁▁▁▁▁▁▁▁▁▁█▁▁▁▁▁█
                         2.89 ipc ( 97.08% cache)   4.38M branch misses
                1.21G cycles   3.50G instructions 166.38M c-refs   4.86M c-misses

summary
  smol-toml (Temporal)
   1.06x faster than smol-toml (Date)
   2.05x faster than fast-toml
   4.14x faster than @ltd/j-toml
   4.6x faster than @decimalturn/toml-patch (Date)
   4.87x faster than @decimalturn/toml-patch (Temporal)
   6.23x faster than js-toml
   9.51x faster than @std/toml
   12.38x faster than toml (Date/string)
   13.04x faster than toml (Temporal)

node --expose-gc bench/stringify.bench.ts
clk: ~5.38 GHz
cpu: AMD Ryzen 9 9950X3D 16-Core Processor
runtime: node 26.10.0 (x64-linux)

benchmark                   avg (min … max) p75 / p99    (min … top 1%)
------------------------------------------- -------------------------------
• spec document
------------------------------------------- -------------------------------
smol-toml                      2.68 µs/iter   2.68 µs   █
                        (2.61 µs … 2.91 µs)   2.89 µs  ▅█▇▂
                    (  4.29 kb …   4.39 kb)   4.30 kb ▇████▅▄▄▁▁▁▁▂▂▁▁▁█▂▁▂
                   4.41 ipc ( 99.57% cache)    6.85 branch misses
         14.77k cycles  65.13k instructions   1.43k c-refs    6.19 c-misses

@iarna/toml                    9.71 µs/iter   9.66 µs   █
                      (9.31 µs … 132.37 µs)  11.48 µs  ▄█▆
                    (232.00  b … 681.09 kb)  26.28 kb ▁███▆▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   3.85 ipc ( 99.49% cache)   33.76 branch misses
         55.12k cycles 212.42k instructions   8.62k c-refs   43.87 c-misses

@ltd/j-toml                   48.15 µs/iter  47.84 µs       █▇
                     (38.21 µs … 312.67 µs)  66.76 µs       ██
                    (  2.72 kb … 382.48 kb)  35.59 kb ▁▁▁▂▂▁██▄▂▁▁▁▁▁▁▁▁▁▁▁
                   3.86 ipc ( 99.59% cache)  322.22 branch misses
        270.56k cycles   1.04M instructions  27.49k c-refs  113.85 c-misses

@std/toml                      4.86 µs/iter   4.60 µs  █
                      (4.25 µs … 178.46 µs)   8.94 µs  █
                    (440.00  b … 521.36 kb)  18.02 kb ▄█▅▂▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   3.46 ipc ( 99.31% cache)   21.73 branch misses
         26.86k cycles  92.81k instructions   4.73k c-refs   32.73 c-misses

js-toml                        5.76 µs/iter   5.77 µs             ▃█
                        (5.69 µs … 5.83 µs)   5.81 µs         ▂ ▇▂██
                    (  1.94 kb …   7.02 kb)   2.16 kb ▆▁▁▁▁▆▁▆█▆████▆▆▁▆▁▆▆
                   4.34 ipc ( 99.16% cache)   34.91 branch misses
         32.34k cycles 140.35k instructions   3.29k c-refs   27.55 c-misses

@decimalturn/toml-patch       59.57 µs/iter  57.71 µs  █
                     (53.70 µs … 630.39 µs) 110.05 µs  █
                    (  4.04 kb …   1.10 mb) 108.22 kb ▅█▆▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
                   3.94 ipc ( 98.84% cache)  787.33 branch misses
        333.69k cycles   1.32M instructions  48.19k c-refs  561.33 c-misses

summary
  smol-toml
   1.81x faster than @std/toml
   2.15x faster than js-toml
   3.62x faster than @iarna/toml
   17.96x faster than @ltd/j-toml
   22.22x faster than @decimalturn/toml-patch

• 5MB document
------------------------------------------- -------------------------------
smol-toml                     43.72 ms/iter  47.53 ms █                  █
                      (40.14 ms … 48.06 ms)  47.98 ms █ █                █
                    (  9.39 mb …  35.40 mb)  12.82 mb ███▁▁▁▁▁█▁▁▁▁▁▁▁▁▁▁██
                   2.28 ipc ( 95.29% cache)   1.68M branch misses
        225.53M cycles 513.97M instructions  15.50M c-refs 730.62k c-misses

@iarna/toml                  134.59 ms/iter 138.20 ms           █
                    (126.83 ms … 143.64 ms) 138.71 ms           █         █
                    ( 28.96 mb …  54.84 mb)  42.86 mb █▁▁▁█▁▁█▁▁█▁▁▁██▁▁▁██
                   2.65 ipc ( 97.36% cache)   4.43M branch misses
        710.95M cycles   1.88G instructions  84.80M c-refs   2.24M c-misses

@ltd/j-toml                  383.10 ms/iter 388.05 ms                 █
                    (366.11 ms … 390.91 ms) 389.63 ms              █  █  █
                    ( 21.44 mb …  22.42 mb)  21.75 mb █▁▁▁▁▁▁▁▁█▁▁██▁▁█▁▁██
                   3.81 ipc ( 99.05% cache)   4.10M branch misses
          2.08G cycles   7.93G instructions 182.50M c-refs   1.74M c-misses

@std/toml                     71.01 ms/iter  72.24 ms            █
                      (62.44 ms … 81.12 ms)  79.64 ms            █
                    ( 29.44 mb …  62.92 mb)  37.36 mb █▁██▁▁▁██▁██▁▁▁█▁▁▁▁█
                   2.19 ipc ( 95.42% cache)   1.85M branch misses
        347.81M cycles 761.47M instructions  31.77M c-refs   1.46M c-misses

js-toml                      107.22 ms/iter 110.20 ms █
                     (99.03 ms … 114.64 ms) 112.12 ms █             █  █
                    ( 18.56 mb …  48.98 mb)  42.88 mb █▁▁▁▁▁▁▁▁█▁▁▁▁█▁██▁██
                   2.50 ipc ( 96.46% cache)   3.18M branch misses
        573.52M cycles   1.43G instructions  50.22M c-refs   1.78M c-misses

@decimalturn/toml-patch      543.69 ms/iter 570.96 ms    █
                    (515.23 ms … 583.43 ms) 578.06 ms    █
                    (112.55 mb … 144.20 mb) 122.09 mb █▁██▁██▁█▁▁▁▁▁▁▁▁▁███
                   3.30 ipc ( 94.93% cache)   7.55M branch misses
          2.91G cycles   9.59G instructions 234.01M c-refs  11.85M c-misses

summary
  smol-toml
   1.62x faster than @std/toml
   2.45x faster than js-toml
   3.08x faster than @iarna/toml
   8.76x faster than @ltd/j-toml
   12.44x faster than @decimalturn/toml-patch
```

</details>

[Temporal API]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Temporal
[`Temporal.Duration`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration
[`Temporal.Instant`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Instant
[`Temporal.PlainDate`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate
[`Temporal.PlainDateTime`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDateTime
[`Temporal.PlainMonthDay`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainMonthDay
[`Temporal.PlainTime`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainTime
[`Temporal.PlainYearMonth`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainYearMonth
[`Temporal.ZonedDateTime`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime

[toml-lang/toml#514]: https://github.com/toml-lang/toml/issues/514
[toml-lang/toml#1034]: https://github.com/toml-lang/toml/issues/1034
[toml-lang/toml#1105]: https://github.com/toml-lang/toml/issues/1105

[RFC 9557]: https://www.rfc-editor.org/info/rfc9557
