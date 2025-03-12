# IBM Dispatch Dashboard

A web application for tracking and managing support cases assigned to engineers. This application replaces the Excel sheet previously used for case dispatching.

## Features

- **Dashboard**: View daily and weekly case distributions
- **Engineer Management**: Add, edit, and remove engineers
- **Silo Management**: Organize engineers into silos/teams
- **Case Management**: Track support cases with priorities and statuses

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm (v8+)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Dashboard

The dashboard provides two views:

- **Daily View**: Shows cases assigned to engineers for the current day and next 4 days
- **Weekly Distribution**: Provides an overview of case distribution across the week

### Engineer Management

- Add new engineers
- Edit engineer details
- Assign engineers to silos
- Activate/deactivate engineers

### Silo Management

- Create and manage silos/teams
- View engineers assigned to each silo
- Move engineers between silos

## Data Storage

All data is stored in the browser's localStorage. This means:

- Data persists between sessions
- Data is not shared between different browsers or devices
- Clearing browser data will reset the application

## Technologies Used

- React
- TypeScript
- Material UI
- React Router
- date-fns

## License

This project is for internal IBM use only.

## Acknowledgments

- IBM Support Team
- Created to improve case dispatching workflow
