import fs from "fs";
import path from "path";

// Read district data
const districts = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data", "districts.json"),
    "utf-8"
  )
);

// Citizen request examples by category
const categories = {
  Water: [
    "Our village needs a reliable drinking water supply.",
    "Families have to travel far to collect drinking water.",
    "The existing water supply is not enough for the community.",
    "We need more public drinking water facilities."
  ],

  Roads: [
    "The road to our village is badly damaged.",
    "Our main road becomes difficult to use during the monsoon.",
    "We need better road connectivity to nearby towns.",
    "The existing road needs urgent repair."
  ],

  Healthcare: [
    "Our community needs better access to healthcare.",
    "The nearest health facility is very far away.",
    "We need improved healthcare facilities in our area.",
    "Our village needs a better primary healthcare centre."
  ],

  Education: [
    "Our school needs additional classrooms.",
    "Students need better educational facilities.",
    "Our village needs improved access to schools.",
    "The school requires better infrastructure."
  ],

  Transport: [
    "There is not enough public transport in our area.",
    "Our village needs better bus connectivity.",
    "Students and workers struggle to reach nearby towns.",
    "We need more reliable public transportation."
  ],

  Sanitation: [
    "Our community needs better sanitation facilities.",
    "Waste collection is not regular in our area.",
    "We need improved public sanitation infrastructure.",
    "Our village needs better waste management."
  ],

  Electricity: [
    "Power interruptions are frequent in our village.",
    "Our community needs more reliable electricity.",
    "Several areas need improved electricity infrastructure.",
    "We need better power connectivity."
  ],

  "Digital Connectivity": [
    "Internet connectivity is poor in our village.",
    "Students need better internet access.",
    "Our area needs improved digital connectivity.",
    "Mobile network coverage is unreliable."
  ]
};

// Languages commonly associated with each state
function getLanguages(state) {
  const languagesByState = {
    Kerala: ["Malayalam", "English"],
    "Tamil Nadu": ["Tamil", "English"],
    Karnataka: ["Kannada", "English"],
    "West Bengal": ["Bengali", "English"],
    Bihar: ["Hindi", "English"],
    "Uttar Pradesh": ["Hindi", "English"],
    Rajasthan: ["Hindi", "English"],
    Gujarat: ["Gujarati", "English"],
    Assam: ["Assamese", "English"],
    Jharkhand: ["Hindi", "English"],
    Maharashtra: ["Marathi", "Hindi", "English"]
  };

  return languagesByState[state] || ["English"];
}

// Urgency values for synthetic demonstration data
const urgencyValues = ["Low", "Medium", "High"];

// Store generated requests
const requests = [];

let id = 1;

// Generate citizen requests
for (const district of districts) {
  for (const category of Object.keys(categories)) {
    for (let i = 0; i < 6; i++) {
      // Get request examples for this category
      const messages = categories[category];

      // Select a random request
      const text =
        messages[Math.floor(Math.random() * messages.length)];

      // Select a language appropriate for the state
      const stateLanguages = getLanguages(district.state);

      const language =
        stateLanguages[
          Math.floor(Math.random() * stateLanguages.length)
        ];

      // Select a random urgency
      const urgency =
        urgencyValues[
          Math.floor(Math.random() * urgencyValues.length)
        ];

      // Add request to dataset
      requests.push({
        request_id: `REQ-${String(id).padStart(5, "0")}`,
        state: district.state,
        district: district.district,
        language,
        category,
        request_text: text,
        urgency
      });

      id++;
    }
  }
}

// Save generated dataset
const outputPath = path.join(
  process.cwd(),
  "data",
  "citizen_requests.json"
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(requests, null, 2),
  "utf-8"
);

console.log(`Generated ${requests.length} citizen requests.`);
console.log(`Saved to: ${outputPath}`);