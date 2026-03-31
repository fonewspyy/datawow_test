# Full-stack Developer Assignment (Next.js + NestJS)

## Instructions

- You have 7 days to complete this test.

## User Stories / Tasks

### Task 1: Basic Setup and Landing Page

- Create a new project using Next.js for the frontend and NestJS for the backend.
- Set up the basic landing page using Next.js that will serve as the main entry point.

### Task 2: Responsive Design

- Design the app responsively following the design in Figma.
- It should render correctly across multiple devices: mobile, tablet, and desktop.
- Utilize CSS/HTML for front-end design.
- You can utilize CSS frameworks such as Tailwind or Bootstrap for layout and design, but custom CSS and HTML should also be evident.

### Task 3: Free Concert Tickets - CRUD

Create a RESTful API using NestJS to enable CRUD operations.

#### Infrastructure

- Use PostgreSQL database, set up using Docker Compose.
- Support database versioning using migrations.
- Provide a Dockerfile that allows the application to build successfully.
- You can use any ORM of choice.

#### Admin

- Able to create and delete concerts.
  - Name
  - Description
  - Seat: total number of seats
- Able to view users' reservation history.

#### User

- Able to view all concerts, including out-of-ticket concerts.
- Able to reserve seats: 1 seat per 1 user.
- Able to cancel reserved seats.
- Able to view their own reservation history.

Figma:

- https://www.figma.com/file/OiQSDKbuwLpFCxpnLkTiNP/Concert?type=design&node-id=0-1&mode=design&t=mNFbliIhsKArwma6-0

### Task 4: Server Side Error Handling

1. Implement server-side validation. If a POST request is not valid, for example missing title or content, the server should return an appropriate error response.
2. This error should be handled at the client and displayed to the user.

### Task 5: Unit Tests

1. Ensure your backend functions, especially the CRUD operation handlers, have corresponding unit tests.
2. Frontend tests are not required, but are a bonus.

## Delivery

Please share a GitHub repository link with the complete codebase, making sure to commit regularly to showcase your progress.

Avoid single, large commits.

In the README file, document:

- Any setup/configurations necessary to run the app locally.
- An overview of the application's architecture/design.
- Any libraries or packages included and their role in the project.
- How to run the unit tests.

## Review Criteria

- Correctness and completeness: Does the application fulfill the requirements and user stories?
- Code clarity and structure: Is the application code well-structured, readable, and maintainable?
- Responsive design: How well does the app respond to different screen sizes?
- Error handling: How effectively does the app handle expected and unexpected errors on both the backend and the frontend?
- Testing: Are the unit tests comprehensive and do they pass?
- Documentation: Is the README file comprehensive and does it explain how to set up, run, and test the app?

## Note

This test should not take more than 3-4 hours. If you find yourself stuck on one task, strive to achieve as much as possible from the other tasks.

It is equally important to observe how you handle ambiguous situations or difficult tasks.

## Bonus Task (Optional)

- Express your opinion on how to optimize the website if it contains intensive data and more concurrent access causes slower performance.
- Express your opinion on how to handle the case where many users want to reserve tickets at the same time.
- We want to ensure that in the concerts there is no one that needs to stand up during the show.