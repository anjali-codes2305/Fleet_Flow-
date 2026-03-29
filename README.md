# 🚛 FleetFlow

FleetFlow is an advanced, comprehensive fleet management companion designed to streamline operations, track vehicles, and manage drivers, trips, maintenance, and expenses. It offers powerful analytics and a robust dashboard for complete operational visibility.

## ✨ Key Features

- **📊 Comprehensive Dashboard**: Get a high-level overview of fleet status, recent activities, and key metrics at a glance.
- **🚗 Vehicle Management**: Keep detailed records of all vehicles in your fleet, including status, model, and specifications.
- **🧑‍✈️ Driver Management**: Track driver profiles, documentations, and assign them easily to vehicles or trips.
- **🗺️ Trip Tracking**: Log and monitor trips, including start and end details, distance, and associated costs.
- **💰 Expense Logging**: Monitor fuel, tolls, and other operational expenses associated with vehicles and drivers.
- **🛠️ Maintenance Scheduling**: Keep your fleet in top condition with maintenance tracking and scheduling.
- **📈 Performance Analytics**: Deep dive into data around fuel efficiency, costs, and fleet utilization.
- **🏆 Leaderboards**: Encourage healthy competition among drivers with gamified performance leaderboards.
- **👥 User Management**: Manage role-based access securely.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn UI, Framer Motion
- **Database Backend**: Supabase
- **Mapping**: Leaflet

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chetan2835/FleetFlow.git
   cd FleetFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and configure necessary environment variables based on standard setup (e.g., Supabase credentials).

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080) (or the port specified in terminal) in your browser to view the application.

### Building for Production

To pack the project for production deployment, run:
```bash
npm run build
```

This will generate optimized and compiled assets into the `dist` directory.

## 🤝 Contributing

Contributions are welcome!

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
