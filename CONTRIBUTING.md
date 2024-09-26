# How to Contribute

We're so thankful you're considering contributing to an [open source project of
the U.S. government](https://code.gov/)! If you're unsure about anything, just
ask -- or submit the issue or pull request anyway. The worst that can happen is
you'll be politely asked to change something. We appreciate all friendly
contributions.

We encourage you to read this project's CONTRIBUTING policy (you are here), its
[LICENSE](LICENSE.md), and its [README](README.md).


## Approach & Design

  [fafsa_spec_2025_26]: https://fsapartners.ed.gov/knowledge-center/library/handbooks-manuals-or-guides/2024-08-23/2025-26-fafsa-specifications-guide-september-2024-update
  [spec_2025_26_vol_4_xlsx]: https://fsapartners.ed.gov/sites/default/files/2024-08/202526ISIRRecLayout.xlsx
  [isir-module]: ./js/isir-module-2025-2026.js
  [isir-viewer]: ./isir-viewer-2025-2026.html

Using the sections and fields detailed in the [2025–26 ISIR Record Layout in Excel Format][spec_2025_26_vol_4_xlsx], 
the JavaScript source of [`isir-module-2025-2026.js`][isir-module] is automatically generated for every field.

Each ISIR record field is specified by start postion, stop position, and length, as well as notes on how to interpret the data specific to each field. 
Note that the specification uses a `1`-based position offset, whereas JavaScript uses a zero based index.

The [`isir-module-2025-2026.js`][isir-module] module is a copy of the generated JavaScript module from the Excel specification.
The module is then embedded in [`isir-viewer-2025-2026.html`][isir-viewer] for reading individual ISIR fields.


### ISIR technical specification for FAFSA 2025-26

Using published [2025–26 FAFSA Specifications Guide][fafsa_spec_2025_26] specification, 
_Volume 4A – Record Layouts_, [2025–26 ISIR Record Layout in Excel Format][spec_2025_26_vol_4_xlsx]


### Building dependencies

This project sources dependencies directly from CDNs.


### Building the Project

This project has no build or compilation steps.


### Workflow and Branching

We follow the [GitHub Flow Workflow](https://guides.github.com/introduction/flow/)

1.  Fork the project
1.  Check out the `main` branch
1.  Create a feature branch
1.  Write code and tests for your change
1.  From your branch, make a pull request against this repo.
1.  Work with repo maintainers to get your change reviewed
1.  Wait for your change to be pulled into this repo.
1.  Delete your feature branch 


## Security and Responsible Disclosure Policy
Refer to the [Department of Education Vulnerability Disclosure Policy](https://www.ed.gov/vulnerability-disclosure-policy)

## Public domain

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request or issue, you are agreeing to comply with this waiver of copyright interest.
