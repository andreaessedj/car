// A sample of Italian cities with coordinates to ensure check-ins are on land.
const cities = [
    { name: "Roma", lat: 41.9028, lon: 12.4964 },
    { name: "Milano", lat: 45.4642, lon: 9.1900 },
    { name: "Napoli", lat: 40.8518, lon: 14.2681 },
    { name: "Torino", lat: 45.0703, lon: 7.6869 },
    { name: "Palermo", lat: 38.1157, lon: 13.3615 },
    { name: "Genova", lat: 44.4056, lon: 8.9463 },
    { name: "Bologna", lat: 44.4949, lon: 11.3426 },
    { name: "Firenze", lat: 43.7696, lon: 11.2558 },
    { name: "Bari", lat: 41.1171, lon: 16.8719 },
    { name: "Catania", lat: 37.5079, lon: 15.0830 },
    { name: "Venezia", lat: 45.4408, lon: 12.3155 },
    { name: "Verona", lat: 45.4384, lon: 10.9916 },
    { name: "Messina", lat: 38.1938, lon: 15.5540 },
    { name: "Padova", lat: 45.4064, lon: 11.8768 },
    { name: "Trieste", lat: 45.6495, lon: 13.7768 },
    { name: "Brescia", lat: 45.5416, lon: 10.2118 },
    { name: "Parma", lat: 44.8015, lon: 10.3280 },
    { name: "Prato", lat: 43.8807, lon: 11.0969 },
    { name: "Modena", lat: 44.6471, lon: 10.9252 },
    { name: "Reggio Calabria", lat: 38.1147, lon: 15.6500 },
    { name: "Perugia", lat: 43.1122, lon: 12.3888 },
    { name: "Livorno", lat: 43.5435, lon: 10.3106 },
    { name: "Cagliari", lat: 39.2238, lon: 9.1217 },
    { name: "Foggia", lat: 41.4624, lon: 15.5446 },
    { name: "Rimini", lat: 44.0594, lon: 12.5683 },
    { name: "Salerno", lat: 40.6824, lon: 14.7681 },
    { name: "Ferrara", lat: 44.8354, lon: 11.6198 },
    { name: "Sassari", lat: 40.7259, lon: 8.5592 },
    { name: "Pescara", lat: 42.4643, lon: 14.2142 },
    { name: "Ancona", lat: 43.6158, lon: 13.5189 },
];

const firstNamesM = ["Marco", "Luca", "Andrea", "Matteo", "Leo", "Simo", "Alex", "Fabio", "Davide", "Chris"];
const firstNamesF = ["Giulia", "Sofia", "Ale", "Chiara", "Fra", "Eli", "Sara", "Vale", "Jessica", "Nicky"];
const adjectives = ["Hot", "Playful", "Curious", "Wild", "Lonely", "Bold", "New", "Free", "Secret"];
const numbers = ["_88", "91", "_", "77", "_00", "x", "xx", "Top"];
const coupleNames = ["Coppia Curiosa", "NoiDue", "Insieme", "HotCouple", "Esploratori", "Solo per stasera", "Coppia Libera"];

const descriptions = [
    "In zona per lavoro, cerco compagnia.",
    "Nuovo in città, chi mi fa da guida?",
    "Serata libera, vediamo che succede.",
    "In cerca di nuove amicizie... e forse altro.",
    "Solo per persone serie e decise.",
    "Chi c'è in giro stasera?",
    "Disponibile per un drink.",
    "Stanco della solita routine.",
    "Proviamo a vedere cosa offre la notte.",
    "Senza impegno, solo divertimento.",
    "Aperti a nuove esperienze.", // For couples
    "Cerchiamo un po' di pepe.", // For couples
];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateNickname(gender: string, status: 'Single' | 'Coppia'): string {
    if (status === 'Coppia') {
        return getRandomElement(coupleNames);
    }
    const names = gender === 'M' ? firstNamesM : firstNamesF;
    const name = getRandomElement(names);
    const adj = getRandomElement(adjectives);
    const num = getRandomElement(numbers);
    
    const format = Math.random();
    if (format < 0.4) return `${name}${adj}${num}`;
    if (format < 0.7) return `${adj}${name}`;
    return `${name}${num}`;
}

export const generateFakeCheckin = () => {
    const status = Math.random() > 0.3 ? 'Single' : 'Coppia';
    const gender = status === 'Coppia' ? 'Coppia' : (Math.random() > 0.5 ? 'M' : 'F');
    const nickname = generateNickname(gender, status);

    const city = getRandomElement(cities);
    // Add small random offset to city coordinates to spread markers
    const lat = city.lat + (Math.random() - 0.5) * 0.1; // Approx +/- 5.5 km
    const lon = city.lon + (Math.random() - 0.5) * 0.1; // Approx +/- 5.5 km

    return {
        nickname: nickname,
        display_name: nickname,
        description: getRandomElement(descriptions),
        lat: lat,
        lon: lon,
        city: city.name,
        photo: null,
        gender: status === 'Coppia' ? null : gender,
        status: status,
        user_id: null,
    };
};
