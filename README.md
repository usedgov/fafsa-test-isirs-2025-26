## **FAFSA Test ISIRs 2025-26**
Test ISIRs for the 2025-26 FAFSA Award Year with standalone tools to view and validate ISIRs and to assist with creating mock data for test ISIRs.

## About the Project
This project is a collaboration between the Department of Education, Federal Student Aid, and the U.S. Digital Service.

Our goal is to accelerate the successful processing of Institutional Student Information Records (ISIRs) for the 2025-26 FAFSA Award Year by our partners in higher education.  

This repository holds test ISIRs and tools to help colleges, third-party servicers, and software vendors prepare to package students’ financial aid as quickly and accurately as possible. The actual 2025-26 FAFSA student and parent application is on [studentaid.gov](https://studentaid.gov/h/apply-for-aid/fafsa).

### ISIR technical specification for FAFSA 2025-2625

  [fafsa_spec_2025_26]: https://fsapartners.ed.gov/knowledge-center/library/handbooks-manuals-or-guides/2024-08-23/2025-26-fafsa-specifications-guide-september-2024-update
  [spec_2025_26_vol_4_xlsx]: https://fsapartners.ed.gov/sites/default/files/2024-08/202526ISIRRecLayout.xlsx
  [isir-module]: ./js/isir-module-2025-2026.js
  [isir-viewer]: ./isir-viewer-2025-2026.html

The test ISIRs and tools have been created using the following specifications:
- [2025–26 FAFSA Specifications Guide][fafsa_spec_2025_26] specification, 
    - _Volume 4A – Record Layouts_,
        - [2025–26 ISIR Record Layout in Excel Format][spec_2025_26_vol_4_xlsx]


## Getting Started

### Test ISIRs
The FSA-provided test ISIR files are available in [the test ISIR folder](./test-isir-files/). They can be downloaded directly from there.

Community-contributed test ISIR files are available in [the contributed ISIR folder](./contributed-isir-files/). This is also the location where you can submit your test ISIRs to share with the community. Instructions are provided in that folder.

### Tools
The following tools are currently available. These tools have limited ongoing support. Additional tools and updates to existing tools will be published as they become available. 

To download a tool: select the file, and on the resulting page click the "Download raw file" button in the upper right menu.

**[`isir-viewer-2025-2026.html`][isir-viewer]**  
This standalone tool can intake a file of ISIRs with `.dat` or `.txt` extension, conduct light field-level validation, export the data as an Excel spreadsheet, and display both the ISIR data and validation results in a simple browser-based user interface.
1. Download the [`isir-viewer-2025-2026.html`][isir-viewer] file.
2. Open `isir-viewer-2025-2026.html` in a browser (Google Chrome or Microsoft Edge preferred).
3. Three sample ISIRs from 9/28/2023 are pre-loaded into the tool. You can view each ISIR using the "Select sample ISIR" menu item.
4. You may also load test ISIRs with `.dat` or `.txt` extensions using the "Select ISIR sample file" menu item.
5. Field-level validation results and a presentation of the ISIR fields are displayed. Data is divided into different expandable sections.
6. To export an Excel (`.xlsx`) spreadsheet of ISIR data, choose "Current" or "All" under the "Export to Spreadsheet" menu item. "Current" will export the currently displayed sample ISIR; "All" will export every ISIR in your currently loaded sample file into one sheet with multiple columns. Clicking on the resulting filename that appears will download the Excel spreadsheet.


**[`./js/isir-module-2025-2026.js`][isir-module]**  
This JavaScript module is used for field-level validation in `isir-viewer-2025-2026.html`. It is not necessary to download this file in order to run any of the provided tools; it is provided to give visibility into how the field-level validation works.



## Changelog
All notable changes to this project are recorded in [CHANGELOG.md](CHANGELOG.md).

## Contact Us
We welcome our partners to continue to submit questions related to the 2025-26 FAFSA launch, including questions or comments about the FSA-developed additional test ISIRs and open-source tools, using the [Contact Customer Support form](https://fsapartners.ed.gov/help-center/contact-customer-support) in FSA’s Partner Connect Help Center. To submit a question, please enter your name, email address, topic, and question. When submitting a question related to this repository, please select the topic “2025-26 FAFSA.” 

We are unable to respond to questions about community-contributed test ISIRs that are accepted into this repository.

## Contributing
Thank you for considering contributing to an Open Source project of the US Government! For more information about our contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).
Principles and guidelines for participating in our open source community are can be found in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## Governance
Information about how this project's community is governed may be found in [GOVERNANCE.md](GOVERNANCE.md).

## Security and Responsible Disclosure Policy
Refer to the [Department of Education Vulnerability Disclosure Policy](https://www.ed.gov/vulnerability-disclosure-policy)

## Public domain

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request or issue, you are agreeing to comply with this waiver of copyright interest.
