import { writeFileSync } from "node:fs";

const esc = (v) => (v == null ? "null" : `'${String(v).replaceAll("'", "''")}'`);
const bool = (v) => (v ? "true" : "false");

const yards = [
  ["pflugerville", "TwentyThirty Pflugerville", "Pflugerville", "TX"],
  ["san-antonio", "TwentyThirty San Antonio", "San Antonio", "TX"],
  ["tulsa", "TwentyThirty Tulsa", "Tulsa", "OK"],
];

const assemblies = [
  ["engine", "Engine & fuel", "Engine", 1],
  ["drivetrain", "Transmission & drivetrain", "Drivetrain", 2],
  ["cooling", "Cooling & HVAC", "Cooling", 3],
  ["front", "Front end & lighting", "Front", 4],
  ["body", "Body & glass", "Body", 5],
  ["interior", "Interior & electronics", "Interior", 6],
  ["chassis", "Brakes, suspension & steering", "Chassis", 7],
  ["wheels", "Wheels & tires", "Wheels", 8],
];

const vehicles = [
  {
    vin: "WBA8E9C55HNU12345",
    year: 2017, make: "BMW", model: "330i", trim: "xDrive",
    body: "4-door sedan", engine: "2.0L turbo I4", engine_code: "B48B20",
    transmission: "8-speed automatic", drivetrain: "AWD",
    color: "Mineral Grey", plant: "Munich (N)",
    mileage: 98440, yard_id: "pflugerville", intake_at: "2026-03-12",
    title_status: "salvage", damage: "Rear impact — trunk and rear body",
    photo: "/images/vehicles/bmw-330i.jpg",
  },
  {
    vin: "1FTEW1EP6JFA12345",
    year: 2018, make: "Ford", model: "F-150", trim: "XLT SuperCrew",
    body: "Crew cab pickup", engine: "5.0L V8", engine_code: "Coyote",
    transmission: "10-speed automatic", drivetrain: "4WD",
    color: "Oxford White", plant: "Dearborn (F)",
    mileage: 142200, yard_id: "san-antonio", intake_at: "2026-02-28",
    title_status: "salvage", damage: "Hail — hood, roof, bedsides",
    photo: "/images/vehicles/f150.jpg",
  },
  {
    vin: "19XFB2F50FE012345",
    year: 2015, make: "Honda", model: "Civic", trim: "EX",
    body: "4-door sedan", engine: "1.8L I4", engine_code: "R18Z1",
    transmission: "CVT", drivetrain: "FWD",
    color: "Aegean Blue", plant: "Greensburg (E)",
    mileage: 167800, yard_id: "pflugerville", intake_at: "2026-04-02",
    title_status: "salvage", damage: "Front clip — bumper, condenser",
    photo: "/images/vehicles/civic.jpg",
  },
  {
    vin: "4T1BF1FK7EU123456",
    year: 2014, make: "Toyota", model: "Camry", trim: "SE",
    body: "4-door sedan", engine: "2.5L I4", engine_code: "2AR-FE",
    transmission: "6-speed automatic", drivetrain: "FWD",
    color: "Predawn Gray", plant: "Georgetown (U)",
    mileage: 201350, yard_id: "tulsa", intake_at: "2026-01-18",
    title_status: "clean", damage: "High miles — mechanical wear, no structural",
    photo: "/images/vehicles/camry.jpg",
  },
  {
    vin: "JF1VA1A68G9801234",
    year: 2016, make: "Subaru", model: "WRX", trim: "Premium",
    body: "4-door sedan", engine: "2.0L turbo H4", engine_code: "FA20F",
    transmission: "6-speed manual", drivetrain: "AWD",
    color: "World Rally Blue", plant: "Gunma (9)",
    mileage: 88120, yard_id: "pflugerville", intake_at: "2026-03-30",
    title_status: "salvage", damage: "Left-front — fender, rail tip",
    photo: "/images/vehicles/wrx.jpg",
  },
  {
    vin: "1GCUYDED4KZ123456",
    year: 2019, make: "Chevrolet", model: "Silverado 1500", trim: "LT Crew Cab",
    body: "Crew cab pickup", engine: "5.3L V8", engine_code: "L84",
    transmission: "8-speed automatic", drivetrain: "4WD",
    color: "Shadow Gray", plant: "Fort Wayne (Z)",
    mileage: 76400, yard_id: "san-antonio", intake_at: "2026-04-11",
    title_status: "salvage", damage: "Rear — tailgate, bed, bumper",
    photo: "/images/vehicles/silverado.jpg",
  },
];

const parts = [
  // BMW
  ["63117288447", "Adaptive LED headlight, left", "front", "BMW", "F30 3 Series adaptive LED headlamp, driver side. Ballast and module included as pulled.", null, 124000, "/images/parts/headlight.jpg"],
  ["63117288448", "Adaptive LED headlight, right", "front", "BMW", "F30 3 Series adaptive LED headlamp, passenger side.", null, 124000, "/images/parts/headlight.jpg"],
  ["51117233773", "Hood", "body", "BMW", "Aluminum hood, Mineral Grey. No prior paint work visible.", null, 89000, "/images/parts/hood.jpg"],
  ["41007244589", "Front door, left", "body", "BMW", "Driver door complete with glass, regulator, and module.", null, 72000, "/images/parts/door.jpg"],
  ["51167244501", "Door mirror, left", "body", "BMW", "Power-fold, heated, auto-dimming, with camera.", null, 38000, "/images/parts/door.jpg"],
  ["12318613341", "Alternator", "engine", "BMW", "B48 180A Bosch unit. Pulled with 98k miles.", null, 42000, null],
  ["24108647921", "GA8HP 8-speed transmission", "drivetrain", "BMW", "xDrive 8HP45 automatic. Still in the donor pending demand.", null, 420000, null],
  ["12148613355", "DME / engine control module", "interior", "BMW", "B48 DME. VIN-locked; programming required.", null, 98000, null],
  ["62119256819", "Instrument cluster", "interior", "BMW", "6WA analog/digital cluster, 98,440 miles shown.", null, 64000, null],
  ["17118613302", "Radiator", "cooling", "BMW", "B48 radiator with fans attached as pulled.", null, 31000, null],
  ["34106855047", "Brake caliper, left front", "chassis", "BMW", "F30 330i front caliper. Pins free.", null, 18000, null],
  ["36116855100", "18-inch alloy wheel", "wheels", "BMW", "Style 400 18x8. One curb mark at 7 o'clock.", null, 32000, null],

  // Ford
  ["FL3Z-13008-B", "Halogen headlight, left", "front", "Ford", "F-150 2015–2020 halogen headlamp, driver side.", "FL3Z-13008-A", 28000, "/images/parts/headlight.jpg"],
  ["FL3Z-13008-C", "Halogen headlight, right", "front", "Ford", "F-150 2015–2020 halogen headlamp, passenger side.", null, 28000, "/images/parts/headlight.jpg"],
  ["FL3Z-16612-A", "Hood", "body", "Ford", "Aluminum hood. Hail dimples across center — listed as-is.", null, 54000, "/images/parts/hood.jpg"],
  ["FL3Z-17D957-A", "Front bumper cover", "front", "Ford", "XLT chrome-delete cover, Oxford White. Lower valence scuffed.", null, 36000, null],
  ["HL3Z-10300-A", "Alternator", "engine", "Ford", "5.0 Coyote 220A. 142k miles.", null, 26000, null],
  ["HL3Z-7000-B", "10R80 10-speed transmission", "drivetrain", "Ford", "10R80 4WD. Pulled, pan intact, 142k miles.", null, 280000, null],
  ["JL3Z-9940700-A", "Tailgate", "body", "Ford", "F-150 tailgate with camera and latch. Hail on outer skin.", null, 48000, null],
  ["HL3Z-10849-A", "PCM", "interior", "Ford", "5.0 / 10R80 PCM. Needs PATS programming.", null, 42000, null],
  ["FL3Z-10849-D", "Instrument cluster", "interior", "Ford", "XLT cluster, 142,200 miles.", null, 22000, null],
  ["HL3Z-1102-A", "20-inch alloy wheel", "wheels", "Ford", "F-150 20x8.5 painted. One pulled, three still on the truck.", null, 18000, null],

  // Honda
  ["33150-TR0-A01", "Headlight, left", "front", "Honda", "9th-gen Civic halogen projector, driver side.", null, 24000, "/images/parts/headlight.jpg"],
  ["33100-TR0-A01", "Headlight, right", "front", "Honda", "9th-gen Civic halogen projector, passenger side.", null, 24000, "/images/parts/headlight.jpg"],
  ["60100-TR0-A90ZZ", "Hood", "body", "Honda", "Civic hood, Aegean Blue. Leading edge chipped from the front hit.", null, 32000, "/images/parts/hood.jpg"],
  ["04711-TR0-A90ZZ", "Front bumper cover", "front", "Honda", "EX bumper. Cracked at the impact bar — listed for parts.", null, 18000, null],
  ["31100-R1A-A01", "Alternator", "engine", "Honda", "R18 12V. 167k miles, charging when pulled.", null, 16000, null],
  ["37820-R1A-A59", "ECM", "interior", "Honda", "R18 / CVT ECM. Immobilizer pairing required.", null, 28000, null],
  ["19010-R1A-A01", "Radiator", "cooling", "Honda", "Civic radiator. Tanks intact, no visible leaks.", null, 12000, null],
  ["67500-TR0-A00ZZ", "Front door, left", "body", "Honda", "Driver door, Aegean Blue, glass intact.", null, 26000, "/images/parts/door.jpg"],

  // Toyota
  ["81150-06161", "Headlight, left", "front", "Toyota", "XV50 Camry halogen, driver side.", null, 22000, "/images/parts/headlight.jpg"],
  ["81110-06161", "Headlight, right", "front", "Toyota", "XV50 Camry halogen, passenger side.", null, 22000, "/images/parts/headlight.jpg"],
  ["53301-06284", "Hood", "body", "Toyota", "Camry hood, Predawn Gray. Clearcoat fade on trailing edge.", null, 28000, "/images/parts/hood.jpg"],
  ["27060-0V030", "Alternator", "engine", "Toyota", "2AR-FE 100A. 201k miles, still charging.", null, 14000, null],
  ["67001-06184", "Front door, left", "body", "Toyota", "Driver door complete, Predawn Gray.", null, 24000, "/images/parts/door.jpg"],
  ["47750-06150", "Brake caliper, left front", "chassis", "Toyota", "XV50 front caliper. Slide pins serviceable.", null, 8000, null],
  ["83181-06160", "Instrument cluster", "interior", "Toyota", "SE cluster, 201,350 miles.", null, 16000, null],
  ["42611-06140", "17-inch alloy wheel", "wheels", "Toyota", "Camry SE 17x7. Average curb wear.", null, 9000, null],

  // Subaru
  ["84001VA181", "Headlight, left", "front", "Subaru", "VA WRX halogen, driver side.", null, 32000, "/images/parts/headlight.jpg"],
  ["84001VA191", "Headlight, right", "front", "Subaru", "VA WRX halogen, passenger side.", null, 32000, "/images/parts/headlight.jpg"],
  ["23700AA791", "Alternator", "engine", "Subaru", "FA20F 12V. 88k miles.", null, 18000, null],
  ["14411AA670", "Turbocharger", "engine", "Subaru", "FA20 twin-scroll turbo. Compressor wheel clean, 88k miles.", null, 110000, null],
  ["57220VA000", "Hood", "body", "Subaru", "WRX hood, World Rally Blue. Vents intact.", null, 48000, "/images/parts/hood.jpg"],
  ["57120VA010", "Front fender, left", "body", "Subaru", "Driver fender. Creased at the wheel arch from the left-front hit.", null, 22000, "/images/parts/door.jpg"],
  ["22611VA000", "Engine control module", "interior", "Subaru", "FA20F ECU. 6MT, USDM. VIN-locked.", null, 52000, null],
  ["30100VA000", "6-speed manual transmission", "drivetrain", "Subaru", "VA 6MT AWD. Still in the donor.", null, 190000, null],

  // Chevy
  ["84592473", "LED headlight, left", "front", "Chevrolet", "T1 Silverado LED reflector headlamp, driver side.", null, 42000, "/images/parts/headlight.jpg"],
  ["84592474", "LED headlight, right", "front", "Chevrolet", "T1 Silverado LED reflector headlamp, passenger side.", null, 42000, "/images/parts/headlight.jpg"],
  ["84056789", "Tailgate", "body", "Chevrolet", "Silverado locking tailgate with camera. Rear impact — dented, latches work.", null, 38000, null],
  ["23478654", "Alternator", "engine", "Chevrolet", "L84 5.3 170A. 76k miles.", null, 20000, null],
  ["24280208", "8-speed automatic transmission", "drivetrain", "Chevrolet", "8L90 4WD. Still in the donor.", null, 260000, null],
  ["84723411", "Radio / infotainment", "interior", "Chevrolet", "8-inch LT radio. Boots, no cracked screen.", null, 24000, null],
  ["23374622", "20-inch alloy wheel", "wheels", "Chevrolet", "Silverado 20x9. Two pulled.", null, 16000, null],
];

const fitment = [
  ["63117288447", 2016, 2018, "BMW", "330i", "F30 LCI adaptive LED, xDrive and RWD"],
  ["63117288447", 2016, 2018, "BMW", "328i", "F30 LCI with adaptive LED package"],
  ["63117288448", 2016, 2018, "BMW", "330i", "F30 LCI adaptive LED"],
  ["51117233773", 2012, 2018, "BMW", "330i", "F30 sedan hood"],
  ["51117233773", 2012, 2018, "BMW", "328i", "F30 sedan hood"],
  ["41007244589", 2012, 2018, "BMW", "330i", "F30 4-door, left"],
  ["12318613341", 2016, 2018, "BMW", "330i", "B48"],
  ["24108647921", 2016, 2018, "BMW", "330i", "8HP xDrive"],
  ["12148613355", 2016, 2018, "BMW", "330i", "B48 DME — must match I-level"],
  ["FL3Z-13008-B", 2015, 2020, "Ford", "F-150", "Halogen, not LED/HID"],
  ["FL3Z-13008-C", 2015, 2020, "Ford", "F-150", "Halogen, not LED/HID"],
  ["FL3Z-16612-A", 2015, 2020, "Ford", "F-150", "Aluminum hood"],
  ["HL3Z-7000-B", 2017, 2020, "Ford", "F-150", "10R80, 5.0 / 3.5 EcoBoost 4WD"],
  ["HL3Z-10300-A", 2015, 2020, "Ford", "F-150", "5.0 Coyote"],
  ["JL3Z-9940700-A", 2018, 2020, "Ford", "F-150", "With camera"],
  ["33150-TR0-A01", 2013, 2015, "Honda", "Civic", "9th-gen sedan halogen"],
  ["33100-TR0-A01", 2013, 2015, "Honda", "Civic", "9th-gen sedan halogen"],
  ["60100-TR0-A90ZZ", 2013, 2015, "Honda", "Civic", "Sedan"],
  ["31100-R1A-A01", 2013, 2015, "Honda", "Civic", "R18"],
  ["37820-R1A-A59", 2013, 2015, "Honda", "Civic", "R18 / CVT"],
  ["81150-06161", 2012, 2014, "Toyota", "Camry", "XV50 halogen"],
  ["81110-06161", 2012, 2014, "Toyota", "Camry", "XV50 halogen"],
  ["53301-06284", 2012, 2014, "Toyota", "Camry", ""],
  ["27060-0V030", 2012, 2017, "Toyota", "Camry", "2AR-FE"],
  ["47750-06150", 2012, 2017, "Toyota", "Camry", ""],
  ["84001VA181", 2015, 2017, "Subaru", "WRX", "VA halogen"],
  ["84001VA191", 2015, 2017, "Subaru", "WRX", "VA halogen"],
  ["14411AA670", 2015, 2021, "Subaru", "WRX", "FA20F"],
  ["23700AA791", 2015, 2021, "Subaru", "WRX", "FA20"],
  ["30100VA000", 2015, 2021, "Subaru", "WRX", "6MT"],
  ["84592473", 2019, 2021, "Chevrolet", "Silverado 1500", "LED, T1"],
  ["84592474", 2019, 2021, "Chevrolet", "Silverado 1500", "LED, T1"],
  ["84056789", 2019, 2021, "Chevrolet", "Silverado 1500", "Crew / Double"],
  ["24280208", 2019, 2021, "Chevrolet", "Silverado 1500", "8L90 4WD"],
];

// vin, oem, position, qty
const bom = [
  // BMW
  ["WBA8E9C55HNU12345", "63117288447", "left", 1],
  ["WBA8E9C55HNU12345", "63117288448", "right", 1],
  ["WBA8E9C55HNU12345", "51117233773", "", 1],
  ["WBA8E9C55HNU12345", "41007244589", "left", 1],
  ["WBA8E9C55HNU12345", "51167244501", "left", 1],
  ["WBA8E9C55HNU12345", "12318613341", "", 1],
  ["WBA8E9C55HNU12345", "24108647921", "", 1],
  ["WBA8E9C55HNU12345", "12148613355", "", 1],
  ["WBA8E9C55HNU12345", "62119256819", "", 1],
  ["WBA8E9C55HNU12345", "17118613302", "", 1],
  ["WBA8E9C55HNU12345", "34106855047", "left-front", 1],
  ["WBA8E9C55HNU12345", "36116855100", "LF", 1],
  // F150
  ["1FTEW1EP6JFA12345", "FL3Z-13008-B", "left", 1],
  ["1FTEW1EP6JFA12345", "FL3Z-13008-C", "right", 1],
  ["1FTEW1EP6JFA12345", "FL3Z-16612-A", "", 1],
  ["1FTEW1EP6JFA12345", "FL3Z-17D957-A", "", 1],
  ["1FTEW1EP6JFA12345", "HL3Z-10300-A", "", 1],
  ["1FTEW1EP6JFA12345", "HL3Z-7000-B", "", 1],
  ["1FTEW1EP6JFA12345", "JL3Z-9940700-A", "", 1],
  ["1FTEW1EP6JFA12345", "HL3Z-10849-A", "", 1],
  ["1FTEW1EP6JFA12345", "FL3Z-10849-D", "", 1],
  ["1FTEW1EP6JFA12345", "HL3Z-1102-A", "LF", 1],
  // Civic
  ["19XFB2F50FE012345", "33150-TR0-A01", "left", 1],
  ["19XFB2F50FE012345", "33100-TR0-A01", "right", 1],
  ["19XFB2F50FE012345", "60100-TR0-A90ZZ", "", 1],
  ["19XFB2F50FE012345", "04711-TR0-A90ZZ", "", 1],
  ["19XFB2F50FE012345", "31100-R1A-A01", "", 1],
  ["19XFB2F50FE012345", "37820-R1A-A59", "", 1],
  ["19XFB2F50FE012345", "19010-R1A-A01", "", 1],
  ["19XFB2F50FE012345", "67500-TR0-A00ZZ", "left", 1],
  // Camry
  ["4T1BF1FK7EU123456", "81150-06161", "left", 1],
  ["4T1BF1FK7EU123456", "81110-06161", "right", 1],
  ["4T1BF1FK7EU123456", "53301-06284", "", 1],
  ["4T1BF1FK7EU123456", "27060-0V030", "", 1],
  ["4T1BF1FK7EU123456", "67001-06184", "left", 1],
  ["4T1BF1FK7EU123456", "47750-06150", "left-front", 1],
  ["4T1BF1FK7EU123456", "83181-06160", "", 1],
  ["4T1BF1FK7EU123456", "42611-06140", "LF", 1],
  // WRX
  ["JF1VA1A68G9801234", "84001VA181", "left", 1],
  ["JF1VA1A68G9801234", "84001VA191", "right", 1],
  ["JF1VA1A68G9801234", "23700AA791", "", 1],
  ["JF1VA1A68G9801234", "14411AA670", "", 1],
  ["JF1VA1A68G9801234", "57220VA000", "", 1],
  ["JF1VA1A68G9801234", "57120VA010", "left", 1],
  ["JF1VA1A68G9801234", "22611VA000", "", 1],
  ["JF1VA1A68G9801234", "30100VA000", "", 1],
  // Silverado
  ["1GCUYDED4KZ123456", "84592473", "left", 1],
  ["1GCUYDED4KZ123456", "84592474", "right", 1],
  ["1GCUYDED4KZ123456", "84056789", "", 1],
  ["1GCUYDED4KZ123456", "23478654", "", 1],
  ["1GCUYDED4KZ123456", "24280208", "", 1],
  ["1GCUYDED4KZ123456", "84723411", "", 1],
  ["1GCUYDED4KZ123456", "23374622", "LF", 1],
];

// sku, vin, oem, position, condition, grade, status, price, photo, notes, removed, marketplace, tested
const inventory = [
  ["U12345-012", "WBA8E9C55HNU12345", "63117288447", "left", "Used — excellent", "A", "listed", 42000, "/images/parts/headlight.jpg", "Lens clear, adaptive motors sweep, no moisture.", "2026-03-18", "eBay Motors", true],
  ["U12345-013", "WBA8E9C55HNU12345", "63117288448", "right", "Used — good", "B", "in_vehicle", 39000, "/images/parts/headlight.jpg", "Still on the donor. Passenger side, no visible damage.", null, null, false],
  ["U12345-021", "WBA8E9C55HNU12345", "51117233773", "", "Used — good", "B", "listed", 28000, "/images/parts/hood.jpg", "Mineral Grey, no dents. Factory paint.", "2026-03-19", "eBay Motors", false],
  ["U12345-033", "WBA8E9C55HNU12345", "41007244589", "left", "Used — excellent", "A", "listed", 37500, "/images/parts/door.jpg", "Complete door. Window cycles. Unrelated to rear damage.", "2026-03-20", "yard", true],
  ["U12345-034", "WBA8E9C55HNU12345", "51167244501", "left", "Used — excellent", "A", "listed", 11000, "/images/parts/door.jpg", "Camera and fold motors work.", "2026-03-20", "yard", true],
  ["U12345-041", "WBA8E9C55HNU12345", "12318613341", "", "Used — tested", "A", "listed", 14500, null, "Bench-tested 14.2V at idle equivalent.", "2026-03-22", "eBay Motors", true],
  ["U12345-050", "WBA8E9C55HNU12345", "24108647921", "", "Used — untested", "B", "in_vehicle", 185000, null, "High-value. Activates when a buyer commits.", null, null, false],
  ["U12345-051", "WBA8E9C55HNU12345", "12148613355", "", "Used — untested", "B", "in_vehicle", 42000, null, "VIN-locked DME. Still in the car.", null, null, false],
  ["U12345-060", "WBA8E9C55HNU12345", "62119256819", "", "Used — good", "B", "listed", 22000, null, "Pixel-perfect. Mileage as-shown 98,440.", "2026-03-21", "yard", false],
  ["U12345-071", "WBA8E9C55HNU12345", "17118613302", "", "Used — good", "B", "listed", 9500, null, "No bent fins. Petcocks free.", "2026-03-22", "yard", false],
  ["U12345-080", "WBA8E9C55HNU12345", "34106855047", "left-front", "Used — good", "B", "listed", 8500, null, "Pins free, piston retracts.", "2026-03-23", "yard", false],
  ["U12345-091", "WBA8E9C55HNU12345", "36116855100", "LF", "Used — good", "B", "listed", 14000, null, "Style 400. One curb mark.", "2026-03-23", "eBay Motors", false],

  ["A12345-011", "1FTEW1EP6JFA12345", "FL3Z-13008-B", "left", "Used — excellent", "A", "listed", 16500, "/images/parts/headlight.jpg", "Halogen, no moisture, tab intact.", "2026-03-04", "eBay Motors", false],
  ["A12345-012", "1FTEW1EP6JFA12345", "FL3Z-13008-C", "right", "Used — excellent", "A", "listed", 16500, "/images/parts/headlight.jpg", "Pair to left.", "2026-03-04", "eBay Motors", false],
  ["A12345-021", "1FTEW1EP6JFA12345", "FL3Z-16612-A", "", "Used — fair", "C", "listed", 12000, "/images/parts/hood.jpg", "Hail dimples. Structure straight. Priced as-is.", "2026-03-05", "yard", false],
  ["A12345-022", "1FTEW1EP6JFA12345", "FL3Z-17D957-A", "", "Used — good", "B", "listed", 14000, null, "Lower valence scuff. No cracks.", "2026-03-05", "yard", false],
  ["A12345-040", "1FTEW1EP6JFA12345", "HL3Z-10300-A", "", "Used — tested", "A", "listed", 12500, null, "Charging. 142k miles.", "2026-03-08", "eBay Motors", true],
  ["A12345-050", "1FTEW1EP6JFA12345", "HL3Z-7000-B", "", "Used — good", "B", "listed", 165000, null, "Pulled 10R80. Fluid clean, no metal on magnet.", "2026-03-10", "eBay Motors", false],
  ["A12345-060", "1FTEW1EP6JFA12345", "JL3Z-9940700-A", "", "Used — fair", "C", "in_vehicle", 18000, null, "Hail on skin. Camera present. Still on the truck.", null, null, false],
  ["A12345-070", "1FTEW1EP6JFA12345", "HL3Z-10849-A", "", "Used — untested", "B", "in_vehicle", 18000, null, "PCM still in the donor.", null, null, false],
  ["A12345-071", "1FTEW1EP6JFA12345", "FL3Z-10849-D", "", "Used — good", "B", "listed", 11000, null, "142,200 miles on the odo.", "2026-03-08", "yard", false],
  ["A12345-090", "1FTEW1EP6JFA12345", "HL3Z-1102-A", "LF", "Used — good", "B", "listed", 9500, null, "One of four. Three remain on the truck.", "2026-03-09", "yard", false],

  ["E01234-011", "19XFB2F50FE012345", "33150-TR0-A01", "left", "Used — good", "B", "listed", 8500, "/images/parts/headlight.jpg", "Unrelated to the front-clip hit. Lens hazed, polishable.", "2026-04-06", "yard", false],
  ["E01234-012", "19XFB2F50FE012345", "33100-TR0-A01", "right", "Used — good", "B", "listed", 8500, "/images/parts/headlight.jpg", "Pair.", "2026-04-06", "yard", false],
  ["E01234-021", "19XFB2F50FE012345", "60100-TR0-A90ZZ", "", "Used — fair", "C", "listed", 7000, "/images/parts/hood.jpg", "Leading edge chips from the impact. No crease.", "2026-04-07", "yard", false],
  ["E01234-022", "19XFB2F50FE012345", "04711-TR0-A90ZZ", "", "Used — poor", "C", "listed", 2500, null, "Cracked. Useful for brackets and fog bezels.", "2026-04-07", "yard", false],
  ["E01234-040", "19XFB2F50FE012345", "31100-R1A-A01", "", "Used — tested", "A", "listed", 7500, null, "Charging at pull. 167k miles.", "2026-04-08", "eBay Motors", true],
  ["E01234-050", "19XFB2F50FE012345", "37820-R1A-A59", "", "Used — untested", "B", "in_vehicle", 12000, null, "ECM still in the Civic.", null, null, false],
  ["E01234-060", "19XFB2F50FE012345", "19010-R1A-A01", "", "Used — good", "B", "listed", 5500, null, "No leaks. Fan intact.", "2026-04-08", "yard", false],
  ["E01234-070", "19XFB2F50FE012345", "67500-TR0-A00ZZ", "left", "Used — excellent", "A", "listed", 14000, "/images/parts/door.jpg", "Away from the front hit. Glass and paint good.", "2026-04-09", "eBay Motors", false],

  ["U12345-T11", "4T1BF1FK7EU123456", "81150-06161", "left", "Used — good", "B", "listed", 6500, "/images/parts/headlight.jpg", "Halogen, typical haze.", "2026-01-24", "yard", false],
  ["U12345-T12", "4T1BF1FK7EU123456", "81110-06161", "right", "Used — good", "B", "listed", 6500, "/images/parts/headlight.jpg", "Pair.", "2026-01-24", "yard", false],
  ["U12345-T21", "4T1BF1FK7EU123456", "53301-06284", "", "Used — good", "B", "listed", 9000, "/images/parts/hood.jpg", "Clearcoat fade. No dents.", "2026-01-25", "yard", false],
  ["U12345-T40", "4T1BF1FK7EU123456", "27060-0V030", "", "Used — tested", "A", "listed", 6000, null, "201k miles, still charging.", "2026-01-26", "eBay Motors", true],
  ["U12345-T33", "4T1BF1FK7EU123456", "67001-06184", "left", "Used — good", "B", "listed", 11000, "/images/parts/door.jpg", "Complete door.", "2026-01-25", "yard", false],
  ["U12345-T80", "4T1BF1FK7EU123456", "47750-06150", "left-front", "Used — good", "B", "listed", 3500, null, "High miles, pins free.", "2026-01-27", "yard", false],
  ["U12345-T60", "4T1BF1FK7EU123456", "83181-06160", "", "Used — fair", "C", "listed", 4500, null, "201,350 miles. Dead pixel on odo, backlight even.", "2026-01-26", "yard", false],
  ["U12345-T90", "4T1BF1FK7EU123456", "42611-06140", "LF", "Used — fair", "C", "listed", 4000, null, "Curb wear. Straight.", "2026-01-27", "yard", false],

  ["801234-011", "JF1VA1A68G9801234", "84001VA181", "left", "Used — good", "B", "listed", 14500, "/images/parts/headlight.jpg", "Driver lamp clear of the left-front crease.", "2026-04-04", "eBay Motors", false],
  ["801234-012", "JF1VA1A68G9801234", "84001VA191", "right", "Used — excellent", "A", "listed", 16000, "/images/parts/headlight.jpg", "Passenger side untouched.", "2026-04-04", "eBay Motors", false],
  ["801234-040", "JF1VA1A68G9801234", "23700AA791", "", "Used — tested", "A", "listed", 9500, null, "88k miles, charging.", "2026-04-05", "yard", true],
  ["801234-041", "JF1VA1A68G9801234", "14411AA670", "", "Used — excellent", "A", "listed", 89000, null, "Turbo pulled. Shaft play in spec, compressor clean.", "2026-04-06", "eBay Motors", true],
  ["801234-021", "JF1VA1A68G9801234", "57220VA000", "", "Used — good", "B", "listed", 24000, "/images/parts/hood.jpg", "WRB, vents intact, no crease.", "2026-04-05", "eBay Motors", false],
  ["801234-022", "JF1VA1A68G9801234", "57120VA010", "left", "Used — poor", "C", "listed", 4000, "/images/parts/door.jpg", "Creased at the arch. Bracket / liner useful.", "2026-04-05", "yard", false],
  ["801234-050", "JF1VA1A68G9801234", "22611VA000", "", "Used — untested", "B", "in_vehicle", 22000, null, "ECU still in the WRX.", null, null, false],
  ["801234-060", "JF1VA1A68G9801234", "30100VA000", "", "Used — untested", "B", "in_vehicle", 95000, null, "6MT. Activates on demand.", null, null, false],

  ["Z12345-011", "1GCUYDED4KZ123456", "84592473", "left", "Used — excellent", "A", "listed", 24000, "/images/parts/headlight.jpg", "LED, away from the rear hit.", "2026-04-14", "eBay Motors", false],
  ["Z12345-012", "1GCUYDED4KZ123456", "84592474", "right", "Used — excellent", "A", "listed", 24000, "/images/parts/headlight.jpg", "Pair.", "2026-04-14", "eBay Motors", false],
  ["Z12345-060", "1GCUYDED4KZ123456", "84056789", "", "Used — fair", "C", "listed", 11000, null, "Dented from the rear hit. Latch and camera work.", "2026-04-15", "yard", false],
  ["Z12345-040", "1GCUYDED4KZ123456", "23478654", "", "Used — tested", "A", "listed", 11000, null, "76k miles, charging.", "2026-04-16", "yard", true],
  ["Z12345-050", "1GCUYDED4KZ123456", "24280208", "", "Used — untested", "B", "in_vehicle", 145000, null, "8L90 still in the truck.", null, null, false],
  ["Z12345-070", "1GCUYDED4KZ123456", "84723411", "", "Used — excellent", "A", "listed", 17500, null, "8-inch screen, no cracks, boots.", "2026-04-16", "eBay Motors", true],
  ["Z12345-090", "1GCUYDED4KZ123456", "23374622", "LF", "Used — good", "B", "listed", 8500, null, "One of four. Two remain on the truck.", "2026-04-15", "yard", false],
];

function row(values) {
  return `  (${values.join(", ")})`;
}

const lines = [];
lines.push("-- Seeded TwentyThirty yard: 6 donors, canonical OEM parts, inventory instances.");
lines.push("");
lines.push("insert into yards (id, name, city, state) values");
lines.push(yards.map((y) => row(y.map(esc))).join(",\n") + ";");
lines.push("");
lines.push("insert into assemblies (id, name, short_name, sort_order) values");
lines.push(assemblies.map((a) => row([esc(a[0]), esc(a[1]), esc(a[2]), a[3]])).join(",\n") + ";");
lines.push("");
lines.push(`insert into vehicles (vin, year, make, model, trim, body, engine, engine_code, transmission, drivetrain, color, plant, mileage, yard_id, intake_at, title_status, damage, photo) values`);
lines.push(
  vehicles
    .map((v) =>
      row([
        esc(v.vin), v.year, esc(v.make), esc(v.model), esc(v.trim), esc(v.body),
        esc(v.engine), esc(v.engine_code), esc(v.transmission), esc(v.drivetrain),
        esc(v.color), esc(v.plant), v.mileage, esc(v.yard_id), esc(v.intake_at),
        esc(v.title_status), esc(v.damage), esc(v.photo),
      ]),
    )
    .join(",\n") + ";",
);
lines.push("");
lines.push("insert into oem_parts (oem_number, name, assembly_id, brand, description, supercedes, msrp_cents, photo) values");
lines.push(
  parts
    .map((p) => row([esc(p[0]), esc(p[1]), esc(p[2]), esc(p[3]), esc(p[4]), esc(p[5]), p[6] ?? "null", esc(p[7])]))
    .join(",\n") + ";",
);
lines.push("");
lines.push("insert into part_fitment (oem_number, year_start, year_end, make, model, notes) values");
lines.push(
  fitment.map((f) => row([esc(f[0]), f[1], f[2], esc(f[3]), esc(f[4]), esc(f[5])])).join(",\n") + ";",
);
lines.push("");
lines.push("insert into vehicle_bom (vin, oem_number, position, qty) values");
lines.push(bom.map((b) => row([esc(b[0]), esc(b[1]), esc(b[2]), b[3]])).join(",\n") + ";");
lines.push("");
lines.push("insert into inventory (sku, vin, oem_number, position, condition, grade, status, price_cents, photo, notes, removed_at, marketplace, tested) values");
lines.push(
  inventory
    .map((i) =>
      row([
        esc(i[0]), esc(i[1]), esc(i[2]), esc(i[3]), esc(i[4]), esc(i[5]), esc(i[6]),
        i[7] ?? "null", esc(i[8]), esc(i[9]), esc(i[10]), esc(i[11]), bool(i[12]),
      ]),
    )
    .join(",\n") + ";",
);

writeFileSync("/workspace/migrations/0003_seed.sql", lines.join("\n") + "\n");
console.log({
  yards: yards.length,
  assemblies: assemblies.length,
  vehicles: vehicles.length,
  parts: parts.length,
  fitment: fitment.length,
  bom: bom.length,
  inventory: inventory.length,
  listed: inventory.filter((i) => i[6] === "listed").length,
  in_vehicle: inventory.filter((i) => i[6] === "in_vehicle").length,
});
