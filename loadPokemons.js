const fs = require("fs").promises;
const fsSync = require("fs");
const csv = require("csvtojson");
const { faker } = require("@faker-js/faker");

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
    types: [
      item.Type1.toLowerCase(),
      item.Type2 ? item.Type2.toLowerCase() : null,
    ],
    url: `images/${item.Name}.png`,
    description: faker.lorem.lines(2),
    height: faker.number.int({ max: 100 }),
    weight: faker.number.int({ max: 100 }),
    categories: faker.animal.type(),
    abilities: faker.word.verb() + " " + faker.word.adverb(),
  }));

  //Write data to json
  let data = JSON.parse(fsSync.readFileSync("pokemons.json"));
  data.pokemons = newData;
  fsSync.writeFileSync("pokemons.json", JSON.stringify(data));
};

loadPokemons();
