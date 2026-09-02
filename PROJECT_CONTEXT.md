\# SMART RENTAL TRACKING SYSTEM



\## Caterpillar Campus Hackathon — Master Project Context



\*\*Project Type:\*\* College Hackathon MVP

\*\*Target Company:\*\* Caterpillar

\*\*Problem:\*\* Smart Rental Tracking System

\*\*Primary Goal:\*\* Build a working, demonstrable MVP that converts rental lifecycle data and machine telemetry into operational decisions.



\---



\# 1. PROJECT OBJECTIVE



Construction and mining companies frequently rent machinery and equipment through registered dealers.



Rental operations can become difficult to manage when equipment is tracked manually through spreadsheets, calls, or disconnected systems. This can result in:



\* Lost or unaccounted equipment

\* Equipment being assigned to the wrong site

\* Under-utilized assets

\* Excessive idle time

\* Unexpected rental extensions

\* Equipment downtime

\* Poor visibility into current location/status

\* Difficulty identifying abnormal usage

\* Difficulty predicting future equipment demand



Our solution is a:



> \*\*Smart Rental Decision-Support System that tracks rented assets throughout their lifecycle and converts rental, operational, and telemetry data into alerts, forecasts, anomaly insights, recommendations, and measurable operational impact.\*\*



The system should move the user from:



> \*\*"Where is my equipment?"\*\*



to:



> \*\*"What is happening, why is it happening, what will I need next, and what should I do?"\*\*



\---



\# 2. CORE PRODUCT FLOW



Every rented asset should be traceable throughout its lifecycle:



\*\*CHECK OUT → ASSIGN → TRACK → LOG → DETECT → PREDICT → RECOMMEND → CHECK IN\*\*



The system should demonstrate the following operational story:



\*\*SPOT → EXPLAIN → ACT → PREDICT → PROVE\*\*



\### SPOT



Identify where assets are, their current status, utilization, idle time, overdue state, and operational risks.



\### EXPLAIN



Explain why an asset requires attention.



Example:



> "Asset EQ-104 has unusually high idle time compared with similar assets at this site."



\### ACT



Recommend an operational action:



\* Return

\* Reassign

\* Investigate

\* Extend rental

\* Keep in place



\### PREDICT



Forecast future equipment demand by:



\* Site

\* Equipment type

\* Time period



\### PROVE



Show projected/simulated business impact of recommended actions.



\---



\# 3. REQUIRED MVP CAPABILITIES



The system must contain these six core capabilities.



\## 3.1 Asset Dashboard / Fleet Command Center



Provide a centralized operational dashboard containing:



\* Total rented assets

\* Active assets

\* Idle assets

\* Overdue assets

\* Unknown/unassigned assets

\* Utilization metrics

\* Runtime/engine hours

\* Idle hours

\* Operating days

\* Assets by site

\* Assets by equipment type

\* Rental status

\* Condition

\* Risk indicators

\* Live/simulated location

\* Action queue



The dashboard should turn raw data into operational information.



Example action queue:



| Asset  | Issue         | Recommended Action |

| ------ | ------------- | ------------------ |

| EQ-101 | Overdue       | Return / Extend    |

| EQ-204 | High idle     | Reassign           |

| EQ-301 | Usage anomaly | Investigate        |

| EQ-412 | Future demand | Pre-position       |



\---



\# 4. CHECK-IN / CHECK-OUT



The system must support the rental lifecycle.



\## Check-out



When equipment is rented:



1\. Identify asset

2\. Scan QR / simulate QR scan / manually enter asset ID

3\. Select site

4\. Assign operator if applicable

5\. Record checkout date/time

6\. Set initial condition

7\. Begin tracking



QR/RFID is primarily an \*\*asset identification and lifecycle transition mechanism\*\*.



It does not need to generate engine hours or fuel readings.



\---



\## Check-in



When equipment returns:



1\. Identify asset

2\. Record return date/time

3\. Record final condition

4\. Capture final usage information

5\. Close rental lifecycle

6\. Update asset availability

7\. Preserve rental history



The system must prevent invalid lifecycle transitions where practical.



\---



\# 5. USAGE LOGGING



The system should record or simulate operational telemetry such as:



\* Engine/runtime hours

\* Idle hours

\* Fuel level or fuel usage

\* Operating days

\* Location

\* Utilization

\* Condition

\* Telemetry timestamp

\* Downtime

\* Maintenance/operational events where available



Important distinction:



\### Telemetry



In a real Caterpillar environment, values such as:



\* Engine hours

\* Idle time

\* Fuel

\* Location

\* Machine operating status



could originate from telematics/sensors.



\### Rental / operational data



Values such as:



\* Checkout

\* Check-in

\* Site assignment

\* Operator assignment

\* Rental extension

\* Condition

\* Manual events



may come from users or rental systems.



\### Hackathon MVP



We will use the provided dataset and simulated telemetry where necessary.



Do \*\*not\*\* claim that physical IoT hardware is being deployed.



\---



\# 6. ALERTS



The system must automatically identify important operational conditions.



Initial alert categories should include:



\### Overdue



Rental end date has passed without check-in.



\### Unassigned



Asset exists without an appropriate site/operator assignment.



\### Excessive Idle



Idle time is unusually high relative to runtime or comparable assets.



\### Abnormal Usage



Telemetry or operational behavior is significantly different from expected historical behavior.



\### Downtime / Condition Risk



Asset condition or operational information indicates potential downtime/risk.



Alerts should contain:



\* Alert ID

\* Asset ID

\* Equipment type

\* Site

\* Severity

\* Timestamp

\* Explanation

\* Status

\* Recommended action



Possible actions:



\* Return

\* Reassign

\* Investigate

\* Extend

\* Acknowledge



\---



\# 7. DEMAND FORECASTING



Demand forecasting is a major AI capability.



The product concept is:



> \*\*"Zepto-style demand forecasting for machinery."\*\*



Instead of predicting groceries, the system predicts:



> \*\*What equipment will be needed, at which site, and when?\*\*



Forecast dimensions:



\* Site

\* Equipment type

\* Time period



The system should compare:



\### Predicted demand



against:



\### Available/current supply



while considering:



\* Current rentals

\* Rental end dates

\* Asset utilization

\* Asset condition

\* Asset location

\* Transfer feasibility where possible



Example:



> Site S-04 is expected to need 8 excavators next week, but only 5 are currently available. Three additional excavators should be pre-positioned.



\---



\## Forecasting methodology



Use the \*\*simplest reliable and explainable method supported by the actual dataset\*\*.



Possible methods:



\* Moving average

\* Weighted moving average

\* Exponential smoothing

\* Trend-based forecasting

\* Simple time-series statistical models



Do NOT introduce deep learning unless the dataset genuinely justifies it.



The model must not use hardcoded predictions.



Forecasts must be generated from actual project data.



\---



\# 8. ANOMALY DETECTION



The system should identify unusual machine behavior.



Recommended architecture:



> \*\*Hybrid Rules + Machine Learning\*\*



\### Rule-based detection



Useful for obvious operational cases:



\* Very high idle/runtime ratio

\* Extremely low utilization

\* Excessive rental duration

\* Missing telemetry

\* Unassigned equipment

\* Overdue rental

\* Unexpected condition

\* Long inactivity



\### Machine-learning detection



If the dataset contains enough suitable telemetry:



Use:



\*\*Isolation Forest\*\*



Potential features:



\* Engine hours

\* Idle hours

\* Utilization

\* Fuel

\* Operating days

\* Runtime

\* Temperature if available

\* Other meaningful telemetry variables



The system must explain anomalies in plain language.



Example:



> \*\*Anomaly detected\*\*

>

> EQ-107 has 68% idle time, significantly higher than the typical utilization pattern for similar equipment at this site.



Do not simply display:



> `IsolationForest anomaly\_score = -0.73`



The operational explanation matters more than the raw ML score.



\---



\# 9. RECOMMENDATION ENGINE



The system should recommend what to do with assets.



Example:



> Site S-02 needs an excavator. Which available excavator should be moved there?



Candidate assets should be evaluated based on:



1\. Equipment type compatibility

2\. Availability

3\. Rental end date

4\. Current site

5\. Location/transfer feasibility

6\. Utilization

7\. Condition

8\. Current operational priority



The recommendation engine should use a transparent dynamic scoring approach.



Example conceptual score:



\*\*Recommendation Score =\*\*



\* Equipment compatibility

\* Availability

\* Demand urgency

\* Low current utilization

\* Good condition

\* Transfer feasibility

\* Appropriate rental status



Weights may be chosen during implementation based on the actual data.



Do NOT hardcode:



> "Always recommend EQ-101."



The ranking must be calculated dynamically.



The UI should explain why an asset was recommended.



Example:



> \*\*Recommended: EQ-204\*\*

>

> \* Correct equipment type

> \* Currently under-utilized

> \* Available soon

> \* Good condition

> \* Closest suitable asset

>

> \*\*Expected benefit:\*\* reduce idle time and help cover projected demand at Site S-04.



\---



\# 10. MEASURABLE BUSINESS IMPACT



The solution should demonstrate measurable operational impact.



Possible metrics:



\* Utilization improvement

\* Idle-hour reduction

\* Demand-gap reduction

\* Overdue asset recovery

\* Asset reassignment efficiency

\* Potential rental-extension reduction

\* Equipment availability improvement



Important:



\### Never fabricate real-world results.



If results are simulated/projected using the dataset, label them clearly:



\* Projected

\* Simulated

\* Estimated

\* Potential impact



Example:



> \*\*Projected impact\*\*

>

> Accepting the recommended reassignment could improve utilization from 54% to 67% in the simulated scenario.



The system should calculate such numbers dynamically rather than displaying hardcoded percentages.



\---



\# 11. EXISTING FRONTEND



The project already contains a React frontend created by the team.



The frontend is the starting UI and should be \*\*reused and extended\*\*, not unnecessarily rebuilt.



Current technology includes:



\* React

\* TypeScript

\* Vite

\* Tailwind CSS

\* Recharts

\* Leaflet

\* Lucide React



The frontend currently contains concepts/screens related to:



\* Dashboard

\* Fleet tracking

\* Assets

\* Asset details

\* Check-in / Check-out

\* Usage logs

\* Alerts

\* AI Intelligence



Existing project structures include:



\* `src/components`

\* `src/context`

\* `src/data`

\* `src/screens`

\* `src/assets`



Existing frontend data concepts include things such as:



\* Asset

\* SiteInfo

\* AlertItem

\* AIRecommendation

\* DemandForecast

\* UsageLogItem

\* LifecycleEvent



The implementation agent must inspect the actual repository before changing these structures.



\### Important



Do not remove working frontend functionality merely to simplify backend integration.



Reuse existing components wherever practical.



\---



\# 12. DATASET



The main hackathon dataset is:



```text

data/CAT\_dataset.xlsx

```



The dataset must be inspected before designing the database.



The agent must determine:



\* Workbook sheets

\* Row counts

\* Column names

\* Data types

\* Missing values

\* Duplicate records

\* Date ranges

\* Equipment identifiers

\* Site identifiers

\* Operator identifiers

\* Rental information

\* Telemetry information

\* Historical usage

\* Relationships between tables/sheets



The actual dataset schema is the source of truth.



\### Do not invent database fields merely because they appear in the problem statement.



If a required capability needs information not present in the dataset:



1\. Determine whether it can be derived.

2\. Determine whether it can be simulated safely.

3\. Clearly document the assumption.



\---



\# 13. DATA MODEL PRINCIPLES



The eventual backend/database should be designed around actual data.



Likely conceptual entities may include:



\* Asset

\* Equipment Type

\* Site

\* Operator

\* Rental

\* Usage/Telemetry

\* Alert

\* Lifecycle Event

\* Forecast

\* Anomaly

\* Recommendation



However, these are conceptual entities.



The implementation agent must confirm the exact schema after inspecting the dataset.



Avoid unnecessary database complexity.



\---



\# 14. TARGET ARCHITECTURE



Recommended MVP architecture:



```text

&#x20;                   ┌─────────────────────┐

&#x20;                   │   React Frontend    │

&#x20;                   │ TypeScript + Vite   │

&#x20;                   └──────────┬──────────┘

&#x20;                              │

&#x20;                        REST API / JSON

&#x20;                              │

&#x20;                   ┌──────────▼──────────┐

&#x20;                   │     FastAPI         │

&#x20;                   │     Backend         │

&#x20;                   └──────────┬──────────┘

&#x20;                              │

&#x20;            ┌─────────────────┼─────────────────┐

&#x20;            │                 │                 │

&#x20;            ▼                 ▼                 ▼

&#x20;       Rental APIs       Analytics APIs     Alert APIs

&#x20;            │                 │                 │

&#x20;            └─────────────────┼─────────────────┘

&#x20;                              │

&#x20;                   ┌──────────▼──────────┐

&#x20;                   │    Service Layer    │

&#x20;                   │                     │

&#x20;                   │ Forecasting         │

&#x20;                   │ Anomaly Detection   │

&#x20;                   │ Recommendations     │

&#x20;                   │ Impact              │

&#x20;                   └──────────┬──────────┘

&#x20;                              │

&#x20;                   ┌──────────▼──────────┐

&#x20;                   │       SQLite        │

&#x20;                   │      SQLAlchemy     │

&#x20;                   └─────────────────────┘

```



\---



\# 15. BACKEND TECHNOLOGY



Target MVP backend:



\* Python

\* FastAPI

\* SQLAlchemy

\* Pydantic

\* SQLite

\* Pandas

\* NumPy

\* scikit-learn

\* OpenPyXL



SQLite is acceptable for the hackathon MVP.



Do not spend time setting up production-scale infrastructure.



No need for:



\* Kubernetes

\* Cloud deployment

\* Microservices

\* Kafka

\* Redis

\* Complex authentication infrastructure



unless absolutely necessary.



\---



\# 16. API DESIGN



The backend should expose REST APIs for:



\### Assets



\* List assets

\* Get asset details

\* Get asset telemetry/usage

\* Get assets by site/status/type



\### Rentals



\* Check-out

\* Check-in

\* Rental history

\* Rental status



\### Usage



\* Create/update usage log

\* Retrieve usage history



\### Sites / Operators



\* Retrieve sites

\* Retrieve operators

\* Assignment information



\### Alerts



\* Retrieve alerts

\* Filter alerts

\* Update/acknowledge alert status



\### Forecasting



\* Demand forecast

\* Demand vs supply

\* Forecast by site/equipment type



\### Anomalies



\* Detect anomalies

\* Retrieve anomaly history



\### Recommendations



\* Retrieve recommended assets/actions

\* Show recommendation explanation

\* Accept recommendation where safe



\### Impact



\* Calculate projected impact

\* Compare baseline vs projected scenario



API design should be documented in `API\_CONTRACT.md` once integration begins.



\---



\# 17. ROLE-BASED ACCESS CONTROL



The MVP should support these roles:



\## Fleet Manager



Can:



\* View full fleet

\* View all sites

\* Manage rentals

\* View alerts

\* View AI insights

\* View recommendations

\* View impact



\## Site Manager



Can:



\* View assigned site(s)

\* View assigned equipment

\* Manage relevant rentals

\* View site alerts

\* View site forecasts

\* View recommendations for their site



\## Operator



Can:



\* View assigned equipment

\* Submit usage

\* Perform permitted check-in/check-out actions

\* Update permitted operational information



For the hackathon MVP, a simple persona/session selector is sufficient.



Do not spend valuable development time building production OAuth/JWT infrastructure unless the core MVP is already complete.



\### Security principle



RBAC must be enforced by the backend, not only by hiding frontend buttons.



\---



\# 18. MAP / LOCATION



The UI should provide visual location awareness.



Use the existing Leaflet integration where possible.



The map can show:



\* Asset locations

\* Site locations

\* Asset status

\* Selected asset

\* Potential reassignment/transfer



If the dataset provides coordinates, use them.



If coordinates are absent and simulation is necessary, clearly document that the locations are simulated.



Do not claim GPS/IoT hardware integration if it is not actually implemented.



\---



\# 19. USER EXPERIENCE PRINCIPLES



The application should feel like an operational command center rather than a data-entry application.



Priorities:



\### At-a-glance visibility



The user should quickly understand:



\* What is happening?

\* Which assets need attention?

\* Where are they?

\* Which sites have demand?

\* What action should be taken?



\### Action-oriented UI



Every important insight should lead to an action where possible.



Examples:



```text

Overdue → Return / Extend

High idle → Reassign

Anomaly → Investigate

Demand gap → Pre-position

Good candidate → Recommend / Move

```



\### Explainability



AI outputs must answer:



> \*\*Why is the system saying this?\*\*



\---



\# 20. JUDGING CRITERIA



The solution should optimize for the following judging weights:



| Criterion          | Weight |

| ------------------ | -----: |

| Business Impact    |    25% |

| Innovation         |    25% |

| Technical Solution |    20% |

| User Experience    |    15% |

| AI / Analytics     |    15% |



Therefore, implementation should prioritize:



1\. Clear operational value

2\. Strong end-to-end workflow

3\. Working technical architecture

4\. Good visual UX

5\. Explainable AI



Do not sacrifice core functionality for unnecessary technical complexity.



\---



\# 21. UNIQUE SELLING POINT



The strongest differentiation is:



> \*\*End-to-end rental lifecycle traceability combined with machine telemetry and AI-powered operational decision support.\*\*



The system does not merely track assets.



It:



1\. Tracks the rental lifecycle

2\. Shows current operational state

3\. Detects problems

4\. Explains problems

5\. Predicts future demand

6\. Identifies suitable assets

7\. Recommends actions

8\. Shows projected impact



The product transition is:



> \*\*TRACK → UNDERSTAND → PREDICT → ACT\*\*



\---



\# 22. POSITIONING RELATIVE TO EXISTING CAT TELEMATICS



This project should not claim to replace Caterpillar's existing telemetry/asset platforms.



Instead, position it as a:



> \*\*Rental and Operations Intelligence Layer\*\*



It consumes rental and operational/telemetry data and converts that information into:



\* Rental visibility

\* Operational alerts

\* Demand forecasting

\* Anomaly insights

\* Asset recommendations

\* Decision support

\* Projected business impact



This makes the solution complementary rather than redundant.



\---



\# 23. DEVELOPMENT PRIORITIES



Because this is a time-constrained hackathon, use the following priority system.



\## P0 — Must Work



\* Application starts

\* Existing frontend works

\* Dataset loads

\* Database works

\* API works

\* Frontend communicates with backend

\* Asset dashboard

\* Check-in/check-out

\* Usage logging

\* Alerts



\## P1 — High Value



\* Anomaly detection

\* Demand forecasting

\* Recommendation engine

\* Live/simulated map

\* Asset intelligence



\## P2 — Important if time permits



\* RBAC

\* Projected business impact

\* Advanced filters

\* Better explanations



\## P3 — Do NOT prioritize



\* Fancy authentication

\* Deep-learning models

\* Physical IoT hardware

\* Production cloud infrastructure

\* Chatbots

\* Complex microservices

\* Unnecessary animations

\* Features unrelated to the problem statement



If time becomes limited:



> \*\*Simplify algorithms before removing core capabilities.\*\*



\---



\# 24. DEVELOPMENT PHASES



Development must happen incrementally.



\## Phase 0 — Inspect



Inspect:



\* Repository

\* Existing frontend

\* Dataset

\* Current data structures

\* Dependencies

\* Routing

\* Screens

\* Components



Produce:



\* Architecture understanding

\* Dataset schema

\* Frontend capability map

\* Data-to-feature mapping

\* Proposed backend architecture

\* Database design

\* API contract

\* AI architecture



Do not build backend code before this inspection.



\---



\## Phase 1 — Data + Database Foundation



Implement:



\* FastAPI

\* SQLAlchemy

\* SQLite

\* Dataset ingestion

\* Database models based on actual dataset

\* Repeatable seed/import process

\* Health endpoint

\* Basic data verification

\* Tests



No AI yet.



\---



\## Phase 2 — Core Rental APIs



Implement:



\* Assets

\* Sites

\* Operators

\* Telemetry/usage

\* Check-out

\* Check-in

\* Usage logging

\* Rental history

\* Lifecycle validation



Add API tests.



\---



\## Phase 3 — Frontend Integration



Connect the existing React frontend to the backend.



Implement:



\* Central API service

\* Dashboard data

\* Asset data

\* Asset details

\* Fleet map

\* Check-in/out

\* Usage logs

\* Loading states

\* Error states

\* Refresh after mutations



Preserve existing UI wherever possible.



\---



\## Phase 4 — Operational Alerts



Implement:



\* Overdue alerts

\* Unassigned alerts

\* Excessive idle

\* Abnormal usage

\* Important operational events



Connect them to the Alerts UI.



\---



\## Phase 5 — Anomaly Detection



Implement:



\* Rule-based detection

\* Isolation Forest if dataset supports it

\* Explainable anomaly output

\* Anomaly API

\* UI integration



\---



\## Phase 6 — Demand Forecasting



Implement:



\* Historical demand extraction

\* Site/equipment grouping

\* Forecast model

\* Demand vs supply

\* Rental end-date consideration

\* Forecast API

\* Forecast UI



\---



\## Phase 7 — Recommendation Engine



Implement:



\* Candidate filtering

\* Dynamic ranking

\* Explainable scoring

\* Recommended asset

\* Recommended action

\* UI integration



\---



\## Phase 8 — RBAC



Implement:



\* Fleet Manager

\* Site Manager

\* Operator

\* Simple session/persona

\* Backend authorization

\* Frontend role-aware UI



\---



\## Phase 9 — Business Impact



Implement dynamic:



\* Baseline utilization

\* Projected utilization

\* Idle reduction

\* Demand-gap reduction

\* Overdue recovery

\* Other meaningful metrics



Clearly label simulated/projected outcomes.



\---



\## Phase 10 — Final Integration / Demo



Verify:



\* All six required capabilities

\* AI analytics

\* Recommendations

\* RBAC

\* Impact metrics

\* Frontend/backend integration

\* Tests

\* Build

\* API health

\* Demo scenario



Fix only demo-blocking issues.



Do not introduce unnecessary new features at the end.



\---



\# 25. REQUIRED AI AGENT BEHAVIOR



Any coding AI working on this repository must follow these rules.



\## Before coding



1\. Read `PROJECT\_CONTEXT.md`.

2\. Read `AGENTS.md` if present.

3\. Inspect the current repository.

4\. Inspect the actual dataset before designing data models.

5\. Understand existing frontend functionality.

6\. State the implementation plan.



\## During coding



\* Work only on the requested phase.

\* Reuse existing functionality.

\* Avoid unnecessary rewrites.

\* Do not invent requirements.

\* Do not fabricate Caterpillar APIs.

\* Do not fabricate telemetry integrations.

\* Do not fabricate business metrics.

\* Do not hardcode AI outputs.

\* Do not hardcode recommendations.

\* Do not delete working frontend functionality.

\* Keep changes incremental.

\* Prefer simple, explainable implementations.



\## After every phase



The agent MUST:



1\. Explain what it implemented.

2\. List files created/modified.

3\. Explain important design decisions.

4\. Run automated tests.

5\. Run build/lint checks where applicable.

6\. Give exact manual testing instructions.

7\. State the expected result of each test.

8\. Report known issues.

9\. State what should be done in the next phase.

10\. \*\*STOP and wait for approval before starting the next phase.\*\*



The agent must not silently continue through multiple phases.



\---



\# 26. MANUAL TESTING REQUIREMENT



Every phase must provide manual testing instructions.



Example format:



```text

1\. Start backend:

&#x20;  <command>



2\. Start frontend:

&#x20;  <command>



3\. Open:

&#x20;  <URL>



4\. Navigate to:

&#x20;  <screen>



5\. Perform:

&#x20;  <action>



6\. Expected:

&#x20;  <result>

```



Testing must be understandable to a developer who did not write the implementation.



\---



\# 27. GIT WORKFLOW



The project is currently being developed on:



```text

hackathon-build

```



The original teammate project should remain untouched.



Before significant changes:



```text

git status

```



After each successful phase:



```text

git add .

git commit -m "<phase description>"

```



Do not commit:



\* API keys

\* passwords

\* secrets

\* private credentials

\* proprietary datasets unless explicitly permitted

\* generated databases unless intentionally required



The CAT dataset is currently treated as local-only:



```text

data/CAT\_dataset.xlsx

```



It should remain ignored by Git unless the dataset is explicitly confirmed safe for public redistribution.



\---



\# 28. SECURITY / SECRETS



Never place API keys in:



\* Source code

\* Git

\* `PROJECT\_CONTEXT.md`

\* README

\* frontend files

\* backend source



Use environment variables or the appropriate local AI/provider configuration.



The DeepSeek API key must never be committed to GitHub.



\---



\# 29. CURRENT DEVELOPMENT ENVIRONMENT



Primary development environment:



\* Windows laptop

\* PowerShell

\* Git

\* GitHub

\* OpenCode CLI

\* DeepSeek V4 Pro



Existing frontend:



\* React

\* TypeScript

\* Vite

\* Tailwind CSS

\* Recharts

\* Leaflet

\* Lucide React



Target backend:



\* Python

\* FastAPI

\* SQLAlchemy

\* SQLite

\* Pandas

\* NumPy

\* OpenPyXL

\* scikit-learn



\---



\# 30. TEAM STRUCTURE



Team size:



\*\*2 people\*\*



Recommended split:



\### Developer 1 — Backend / Data / AI



Responsible primarily for:



\* Dataset

\* Database

\* FastAPI

\* APIs

\* Data processing

\* Alerts

\* Forecasting

\* Anomaly detection

\* Recommendations

\* Impact calculations



\### Developer 2 — Frontend / UX / Integration



Responsible primarily for:



\* Existing React UI

\* Dashboard

\* Map

\* Asset views

\* Check-in/out

\* Usage screens

\* Alerts UI

\* AI intelligence UI

\* API integration

\* UX polish



Both developers should coordinate through shared API contracts and Git.



\---



\# 31. DEMO STORY



The final demonstration should tell one coherent story.



\### Step 1 — Dashboard



Show:



\* Fleet size

\* Utilization

\* Idle

\* Overdue

\* Map

\* Alerts

\* Action queue



\### Step 2 — Spot a problem



Select an asset with an anomaly or operational issue.



\### Step 3 — Explain



Show why the system flagged it.



Example:



> High idle time compared with similar assets.



\### Step 4 — Recommend



Show an alternative action or asset.



Example:



> Reassign under-utilized excavator from Site S-01 to Site S-04.



\### Step 5 — Forecast



Show future demand at Site S-04.



Example:



> Excavator demand expected to increase next week.



\### Step 6 — Act



Accept or simulate accepting the recommendation.



\### Step 7 — Prove



Show projected impact:



\* Utilization

\* Idle time

\* Demand gap

\* Asset availability



\---



\# 32. FINAL DEMO PITCH



Core message:



> \*\*"We don't just track where the machine is. We identify what needs attention, explain why, predict where equipment will be needed next, recommend what to move, and show the potential impact of that decision."\*\*



Short innovation statement:



> \*\*"We combine rental lifecycle data, machine telemetry, and explainable AI into one decision-support system that helps rental and site managers detect problems, predict demand, choose the right asset, and act faster."\*\*



\---



\# 33. SUCCESS CRITERIA



The MVP is successful if a judge can understand and demonstrate this complete flow:



```text

Rental created

&#x20;     ↓

Asset checked out

&#x20;     ↓

Assigned to site/operator

&#x20;     ↓

Usage/telemetry recorded

&#x20;     ↓

Dashboard updates

&#x20;     ↓

Problem detected

&#x20;     ↓

Alert generated

&#x20;     ↓

Anomaly explained

&#x20;     ↓

Future demand predicted

&#x20;     ↓

Best asset recommended

&#x20;     ↓

Action accepted/simulated

&#x20;     ↓

Projected impact shown

&#x20;     ↓

Asset eventually checked in

```



The system should feel like one connected product rather than six unrelated screens.



\---



\# 34. GUIDING PRINCIPLE



When deciding whether to build something, ask:



> \*\*Does this help a rental or site manager make a better equipment decision?\*\*



If yes, prioritize it.



If no, defer it unless required by the problem statement.



The ultimate goal is not to build the most complicated system.



The goal is to build the clearest, most convincing working demonstration of:



> \*\*TRACE → MONITOR → DETECT → PREDICT → RECOMMEND → ACT → MEASURE\*\*



\---



\# END OF MASTER PROJECT CONTEXT



