# OEM.autos

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python version](https://img.shields.io/badge/python-3.7%2B-blue.svg)](https://www.python.org/)

A dynamic intelligence platform for extracting and structuring OEM vehicle parts data. Generate flat, itemized Bill of Parts (BoP) outputs in the custom **FOE (Factory Original Equipment)** JSON format.

## 🔍 Overview

`OEM.autos` provides:

* **Hybrid Scraping Engine**: Combines DOM traversal with API calls for robust data extraction from OEM catalogs, eBay listings, and manufacturer diagrams.
* **FOE Schema**: Standardized, flat JSON format for part items, optimized for data pipelines in scrapyards, recyclers, and aftermarket platforms.
* **Metadata Extraction**: Full item details including part number (SKU/MPN), group index, images, brand, pricing, and descriptions.
* **Compatibility Mapping**: Trim, year, engine, and model-level car compatibility fields.

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/MAXIQUID/OEM.autos.git
cd OEM.autos

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## ⚙️ Configuration

Copy and update the example config:

```bash
cp config/example.yaml config/local.yaml
# Edit config/local.yaml with your API keys, user agents, and output settings
```

### Key Config Fields

| Field             | Description                          |
| ----------------- | ------------------------------------ |
| `user_agent`      | Custom UA for HTTP requests          |
| `eBay.app_id`     | eBay API App ID for listing lookups  |
| `output.foe_path` | Filepath for writing FOE JSON output |
| `scrape.delay`    | Seconds to wait between requests     |

## 🚀 Usage

### CLI

```bash
# Run full extraction workflow
python run_scraper.py --config config/local.yaml

# Use flags for specific modules
python run_scraper.py --config config/local.yaml --module ebay
python run_scraper.py --config config/local.yaml --module diagram
```

### Library

```python
from oem_autos import Scraper, FoeFormatter

# Initialize
scraper = Scraper(config_path="config/local.yaml")
items = scraper.extract_from_ebay(item_id="1234567890")

# Format to FOE JSON
formatter = FoeFormatter()
foe_data = formatter.format(items)

# Save
with open("output/boop.json", "w") as f:
    f.write(foe_data)
```

## 🗂 FOE Schema

Each item is a flat JSON object with the following fields:

| Field                 | Type      | Description                    |
| --------------------- | --------- | ------------------------------ |
| `sku`                 | `string`  | Part number or SKU             |
| `mpn`                 | `string`  | Manufacturer Part Number       |
| `title`               | `string`  | Item title                     |
| `description`         | `string`  | Full item description          |
| `group_index`         | `integer` | OEM grouping index             |
| `brand`               | `string`  | Brand name                     |
| `price`               | `number`  | MSRP or listed price           |
| `wholesale_price`     | `number`  | Wholesale price (if available) |
| `image_url`           | `string`  | Primary image URL              |
| `car_make`            | `string`  | Vehicle make                   |
| `car_model`           | `string`  | Vehicle model                  |
| `car_year`            | `integer` | Model year                     |
| `car_trim`            | `string`  | Trim level                     |
| `car_engine`          | `string`  | Engine specification           |
| `compatibility_notes` | `string`  | Notes on compatibilities       |

*(Full schema and examples can be found in `schema/foe_schema.json`.)*

## ⚖️ License

This project is licensed under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add feature"`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## 📫 Contact

For questions or support, reach out to **Nate Lee** at `nathanlivarchuk2@gmail.com` or open an issue. Happy scraping!
