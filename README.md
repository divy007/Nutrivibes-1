# Nutrivibes Diet Planner

A comprehensive meal planning application built with Next.js that allows users to create, manage, and export personalized diet plans.

## Features

- **Interactive Meal Planning**: distinct sections for Breakfast, Lunch, Snack, and Dinner.
- **Smart Food Search**: Filter food items by type (Veg, Non-veg, Vegan) and dietary requirements (e.g., Thyroid Friendly).
- **Rich Data**: Extensive database of food items with nutritional info and descriptions.
- **PDF Export**: Generate professional-looking diet plans in PDF format with a single click.
- **Responsive Design**: Modern, clean UI built with Tailwind CSS for all devices.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Language**: TypeScript

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Nutrivibes
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open the app**
   Visit [http://localhost:3000](http://localhost:3000) to start planning your meals.

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable UI components (MealCard, AddFoodModal, etc.)
├── data/            # Static data files (foodItems, recipes)
├── types/           # TypeScript type definitions
└── utils/           # Helper functions (PDF export logic)
```

## Data Sources

The application uses local static data for instant performance:
- `src/data/foodItems.ts`: Core database of food items with properties like calories, portion size, and dietary tags.
- `src/data/extracted_recipes.json`: Extended dataset for recipe suggestions.

## Key Components

- **AddFoodModal**: A sophisticated modal interface for searching and selecting food items with instant filtering.
- **MealCard**: Displays selected meals for a specific time slot with options to add more or remove items.
- **ClientHeader**: Manages the application state and provides the "Download PDF" functionality.

