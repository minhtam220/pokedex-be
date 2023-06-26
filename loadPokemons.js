const fs = require("fs").promises;
const fsSync = require("fs");
const csv = require("csvtojson");

const loadPokemons = async () => {
  //Load the csv
  let newData = await csv().fromFile("pokemon.csv");

  // Sort the items alphabetically based on the "Name" property
  newData.sort((a, b) => a.Name.localeCompare(b.Name));

  // Remove the pokemon that doesn't have an image
  for (const pokemon of newData) {
    const filePath = `images/${pokemon.Name}.png`;

    try {
      await fs.access(filePath);
      //console.log(filePath + " exists");
    } catch (err) {
      //console.error(filePath + " does not exist");
      newData = newData.filter((item) => item.Name !== pokemon.Name);
    }
  }

  newData = newData.map((item, index) => ({
    id: index + 1, // Adding 1 to the index to start the ID from 1
    name: item.Name,
    type1: item.Type1,
    type2: item.Type2,
  }));

  //Write data to json
  let data = JSON.parse(fsSync.readFileSync("pokemons.json"));
  data.pokemons = newData;
  fsSync.writeFileSync("pokemons.json", JSON.stringify(data));
};

loadPokemons();
