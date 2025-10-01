# ComparIA Dashboard

A production-ready React + TypeScript dashboard for comparing AI model performance across prompts. This static web application ingests CSV data and provides interactive visualizations including heatmaps, line charts, bar charts, and data tables.

## Features

- 📊 **Interactive Visualizations**: Heatmaps, line charts, bar charts with ECharts
- 📋 **Data Tables**: Sortable, filterable tables with pagination
- 🔄 **Data Transformation**: Automatic conversion between matrix and long format
- ⚡ **Derived Metrics**: Calculate CO₂, LED hours, and video streaming equivalents from energy data
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔗 **URL State**: Shareable URLs with current filter selections
- 📥 **Export Functions**: Download charts as PNG and data as CSV
- 🚀 **Static Deployment**: No backend required, perfect for GitHub Pages

## CSV Data Format

Your CSV file must follow this exact format:

```csv
metric,p01,p02,p03,p04,p05,...
gpt4o_quality,4.5,4.2,4.8,4.1,4.6,...
gpt4o_latency_s,0.95,1.10,1.20,0.85,1.05,...
gpt4o_energy_wh,0.0061,0.0068,0.0070,0.0055,0.0063,...
mistral7b_quality,3.8,3.5,4.0,3.2,3.9,...
mistral7b_latency_s,0.45,0.52,0.48,0.41,0.50,...
mistral7b_energy_wh,0.0032,0.0038,0.0035,0.0029,0.0036,...
```

### Requirements:
- **First column**: Must be named `metric`
- **Other columns**: Prompt IDs (e.g., `p01`, `p02`, etc.)
- **Row format**: `{model}_{metric_name}` (supports `_` or `-` separators)
- **Supported metrics**: `quality`, `latency_s`, `energy_wh`, `co2_g`, `led_hours`, `onlinevideo_min`

### Sample Data
A sample CSV file is included at `src/sample/benchmark_flipped.csv` with 4 models and 30 prompts.

## Derived Metrics

When energy data is available, the dashboard can calculate:

- **CO₂ emissions**: `co2_g = (energy_wh / 1000) * grid_intensity_g_per_kwh`
- **LED bulb hours**: `led_hours = energy_wh / bulb_watts`
- **Online video minutes**: `onlinevideo_min = energy_wh / video_wh_per_min`

### Configurable Factors:
- LED bulb watts (default: 7.0 W)
- Grid intensity (default: 300 gCO₂/kWh)
- Online video energy (default: 0.9 Wh/min)

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## GitHub Pages Deployment

### 1. Configure Base Path

Update `vite.config.ts` with your repository name:

```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ... other config
})
```

### 2. Enable GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" section
3. Set source to "GitHub Actions"

### 3. Deploy

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
- Build the project on push to `main`
- Deploy to GitHub Pages
- Make your dashboard available at `https://username.github.io/repo-name/`

## Project Structure

```
src/
├── components/          # React components
│   ├── UploadPanel.tsx     # File upload with drag & drop
│   ├── FactorsPanel.tsx    # Conversion factor controls
│   ├── Filters.tsx         # Model/prompt/metric filters
│   ├── KpiCards.tsx        # Overview statistics cards
│   ├── Heatmap.tsx         # ECharts heatmap visualization
│   ├── ModelLineChart.tsx  # Line chart for model comparison
│   ├── PromptBarChart.tsx  # Bar chart for prompt comparison
│   ├── MatrixTable.tsx     # Original data table view
│   └── LongTable.tsx       # Tidy data table view
├── lib/                 # Utility functions
│   ├── csv.ts              # CSV parsing with Papa Parse
│   ├── parse.ts            # Metric label parsing
│   ├── reshape.ts          # Data transformation utilities
│   ├── stats.ts            # Statistical calculations
│   ├── palette.ts          # Color schemes and themes
│   ├── export.ts           # Export functionality
│   └── urlState.ts         # URL state management
├── styles/              # CSS and styling
│   └── tailwind.css        # Tailwind CSS with custom components
├── sample/              # Sample data
│   └── benchmark_flipped.csv
└── types.ts             # TypeScript type definitions
```

## Customization

### Chart Colors

Modify colors in `src/lib/palette.ts`:

```typescript
export function generateChartColors(count: number): string[] {
  const baseColors = [
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    // Add your custom colors here
  ]
  // ...
}
```

### Conversion Factors

Update default values in `src/types.ts`:

```typescript
export const DEFAULT_FACTORS: Factors = {
  ledBulbWatts: 7.0,           // Your LED bulb wattage
  gridIntensityGCO2PerKwh: 300, // Your grid carbon intensity
  onlineVideoWhPerMin: 0.9,     // Video streaming energy
}
```

### Styling

The project uses Tailwind CSS with custom components. Modify `src/styles/tailwind.css` to customize:
- Color schemes
- Component styles
- Dark mode colors
- Animations

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## Performance

- Optimized for datasets with 100+ prompts
- Table virtualization for large datasets
- Debounced UI updates
- Efficient chart rendering with ECharts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details
