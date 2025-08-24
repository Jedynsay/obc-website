export interface Province {
  name: string;
  cities: string[];
}

export interface Region {
  name: string;
  provinces: Province[];
}

export const philippineLocations: Region[] = [
  {
    name: "Luzon",
    provinces: [
      {
        name: "Metro Manila",
        cities: ["Manila", "Quezon City", "Makati", "Pasig", "Taguig", "Mandaluyong", "San Juan", "Marikina", "Pasay", "Parañaque", "Las Piñas", "Muntinlupa", "Caloocan", "Malabon", "Navotas", "Valenzuela"]
      },
      {
        name: "Rizal",
        cities: ["Antipolo", "Cainta", "Taytay", "Angono", "Binangonan", "Cardona", "Jalajala", "Morong", "Pililla", "Rodriguez", "San Mateo", "Tanay", "Teresa", "Baras"]
      },
      {
        name: "Cavite",
        cities: ["Bacoor", "Cavite City", "Dasmariñas", "General Trias", "Imus", "Kawit", "Rosario", "Tagaytay", "Trece Martires", "Carmona", "General Mariano Alvarez", "Noveleta", "Silang", "Tanza"]
      },
      {
        name: "Laguna",
        cities: ["Calamba", "San Pedro", "Biñan", "Santa Rosa", "Cabuyao", "Los Baños", "San Pablo", "Sta. Cruz", "Pagsanjan", "Lumban", "Bay", "Calauan", "Alaminos", "Famy"]
      },
      {
        name: "Batangas",
        cities: ["Batangas City", "Lipa", "Tanauan", "Santo Tomas", "Calaca", "Lemery", "Nasugbu", "Rosario", "San Jose", "Taal", "Balayan", "Bauan", "Ibaan", "Laurel"]
      },
      {
        name: "Bulacan",
        cities: ["Malolos", "Meycauayan", "San Jose del Monte", "Marilao", "Bocaue", "Guiguinto", "Balagtas", "Bulakan", "Calumpit", "Hagonoy", "Obando", "Paombong", "Plaridel", "Pulilan"]
      },
      {
        name: "Pampanga",
        cities: ["San Fernando", "Angeles", "Mabalacat", "Apalit", "Arayat", "Bacolor", "Candaba", "Floridablanca", "Guagua", "Lubao", "Macabebe", "Magalang", "Masantol", "Mexico"]
      },
      {
        name: "Nueva Ecija",
        cities: ["Cabanatuan", "Gapan", "Muñoz", "Palayan", "San Jose", "Aliaga", "Bongabon", "Cabiao", "Carranglan", "Cuyapo", "Gabaldon", "General Mamerto Natividad", "General Tinio", "Guimba"]
      },
      {
        name: "Tarlac",
        cities: ["Tarlac City", "Bamban", "Camiling", "Capas", "Concepcion", "Gerona", "La Paz", "Mayantoc", "Moncada", "Paniqui", "Pura", "Ramos", "San Clemente", "San Jose"]
      },
      {
        name: "Zambales",
        cities: ["Olongapo", "Subic", "Castillejos", "San Marcelino", "San Antonio", "San Felipe", "San Narciso", "Botolan", "Cabangan", "Candelaria", "Iba", "Masinloc", "Palauig", "Santa Cruz"]
      }
    ]
  },
  {
    name: "Visayas",
    provinces: [
      {
        name: "Cebu",
        cities: ["Cebu City", "Mandaue", "Lapu-Lapu", "Talisay", "Toledo", "Danao", "Carcar", "Naga", "Minglanilla", "Consolacion", "Liloan", "Compostela", "Cordova", "Bogo"]
      },
      {
        name: "Bohol",
        cities: ["Tagbilaran", "Ubay", "Talibon", "Carmen", "Loon", "Calape", "Tubigon", "Clarin", "Inabanga", "Getafe", "Buenavista", "Guindulman", "Jagna", "Garcia Hernandez"]
      },
      {
        name: "Negros Oriental",
        cities: ["Dumaguete", "Bais", "Bayawan", "Canlaon", "Guihulngan", "Tanjay", "Amlan", "Ayungon", "Bacong", "Basay", "Bindoy", "Dauin", "Jimalalud", "La Libertad"]
      },
      {
        name: "Negros Occidental",
        cities: ["Bacolod", "Bago", "Cadiz", "Escalante", "Himamaylan", "Kabankalan", "La Carlota", "Sagay", "San Carlos", "Silay", "Sipalay", "Talisay", "Victorias", "Binalbagan"]
      },
      {
        name: "Iloilo",
        cities: ["Iloilo City", "Passi", "Oton", "Pavia", "Santa Barbara", "Cabatuan", "Janiuay", "Mina", "New Lucena", "Tigbauan", "Guimbal", "Igbaras", "Miagao", "San Joaquin"]
      },
      {
        name: "Leyte",
        cities: ["Tacloban", "Ormoc", "Baybay", "Maasin", "Abuyog", "Alangalang", "Albuera", "Babatngon", "Bato", "Burauen", "Calubian", "Capoocan", "Carigara", "Dagami"]
      },
      {
        name: "Samar",
        cities: ["Catbalogan", "Calbayog", "Borongan", "Basey", "Calbiga", "Daram", "Gandara", "Hinabangan", "Jiabong", "Marabut", "Motiong", "Paranas", "Pinabacdao", "San Jorge"]
      },
      {
        name: "Panay",
        cities: ["Roxas", "Kalibo", "San Jose de Buenavista", "Boracay", "Caticlan", "New Washington", "Batan", "Buruanga", "Ibajay", "Lezo", "Malay", "Makato", "Madalag", "Malinao"]
      }
    ]
  },
  {
    name: "Mindanao",
    provinces: [
      {
        name: "Davao del Sur",
        cities: ["Davao City", "Digos", "Samal", "Santa Cruz", "Bansalan", "Hagonoy", "Kiblawan", "Magsaysay", "Matanao", "Padada", "Sulop"]
      },
      {
        name: "Davao del Norte",
        cities: ["Tagum", "Panabo", "Samal", "Carmen", "Kapalong", "New Corella", "San Isidro", "Santo Tomas", "Talaingod", "Asuncion", "Braulio E. Dujali"]
      },
      {
        name: "Cagayan de Oro",
        cities: ["Cagayan de Oro", "Gingoog", "El Salvador", "Jasaan", "Villanueva", "Tagoloan", "Laguindingan", "Libertad", "Lugait", "Manticao", "Naawan", "Opol"]
      },
      {
        name: "Zamboanga",
        cities: ["Zamboanga City", "Pagadian", "Dipolog", "Dapitan", "Isabela", "Ozamiz", "Tangub", "Oroquieta", "Jimenez", "Sinacaban", "Tudela", "Clarin", "Baliangao", "Plaridel"]
      },
      {
        name: "Bukidnon",
        cities: ["Malaybalay", "Valencia", "Maramag", "Quezon", "Don Carlos", "Kitaotao", "Lantapan", "Libona", "Malitbog", "Manolo Fortich", "Pangantucan", "Sumilao", "Talakag", "Cabanglasan"]
      },
      {
        name: "Lanao del Norte",
        cities: ["Iligan", "Ozamiz", "Tangub", "Tubod", "Bacolod", "Baloi", "Baroy", "Kapatagan", "Kauswagan", "Kolambugan", "Lala", "Linamon", "Magsaysay", "Maigo"]
      },
      {
        name: "Surigao del Norte",
        cities: ["Surigao City", "Siargao", "Dapa", "Del Carmen", "General Luna", "Pilar", "San Benito", "San Isidro", "Santa Monica", "Alegria", "Bacuag", "Burgos", "Claver", "Gigaquit"]
      },
      {
        name: "South Cotabato",
        cities: ["General Santos", "Koronadal", "Kidapawan", "Cotabato City", "Marbel", "Polomolok", "Tupi", "Tampakan", "Tantangan", "Banga", "Lake Sebu", "Norala", "Santo Niño", "Surallah"]
      }
    ]
  }
];

export function getRegionNames(): string[] {
  return philippineLocations.map(region => region.name);
}

export function getProvincesByRegion(regionName: string): Province[] {
  const region = philippineLocations.find(r => r.name === regionName);
  return region ? region.provinces : [];
}

export function getCitiesByProvince(regionName: string, provinceName: string): string[] {
  const region = philippineLocations.find(r => r.name === regionName);
  if (!region) return [];
  
  const province = region.provinces.find(p => p.name === provinceName);
  return province ? province.cities : [];
}