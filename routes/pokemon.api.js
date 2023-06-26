const express = require("express");
const router = express.Router();
const fs = require("fs");
const crypto = require("crypto");

/**
 * params: /
 * description: get all pokemons
 * query:
 * method: get
 */

router.get("/", (req, res, next) => {
  //input validation

  const allowedFilter = ["name", "type1", "type2", "page", "limit"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    //allow title,limit and page query string only
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });
    //processing logic

    //Number of items skip for selection
    let offset = limit * (page - 1);

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;
    //Filter data by title
    let result = [];

    if (filterKeys.length) {
      filterKeys.forEach((condition) => {
        result = result.length
          ? result.filter(
              (pokemon) => pokemon[condition] === filterQuery[condition]
            )
          : pokemons.filter(
              (pokemon) => pokemon[condition] === filterQuery[condition]
            );
      });
    } else {
      result = pokemons;
    }
    //then select number of result by offset
    result = result.slice(offset, offset + limit);

    //send response
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

/**
 * params: /
 * description: get pokemons by id, return the previous, current and next pokemons
 * query:
 * method: get
 */
function isIdExists(id, pokemons) {
  return pokemons.some((pokemon) => pokemon.id === id);
}

router.get("/:pokemonId", (req, res, next) => {
  const { pokemonId } = req.params;

  try {
    //processing logic

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    //Validate the pokemonId
    if (!pokemons.some((pokemon) => pokemon.id === parseInt(pokemonId))) {
      const exception = new Error(`Pokemon ID is not valid.`);
      exception.statusCode = 401;
      throw exception;
    }

    /*
    if (parseInt(pokemonId) > pokemons.length || parseInt(pokemonId) === 0) {
      const exception = new Error(`Pokemon ID is not valid.`);
      exception.statusCode = 401;
      throw exception;
    }
    */

    //Filter data by pokemon Id
    let result = [];

    let currentPokemonIndex = pokemons.findIndex(
      (pokemon) => pokemon.id === parseInt(pokemonId)
    );

    let previousPokemonIndex =
      currentPokemonIndex === 0 ? pokemons.length - 1 : currentPokemonIndex - 1;

    let nextPokemonIndex =
      currentPokemonIndex === pokemons.length - 1 ? 0 : currentPokemonIndex + 1;

    result.push(pokemons[previousPokemonIndex]);
    result.push(pokemons[currentPokemonIndex]);
    result.push(pokemons[nextPokemonIndex]);

    //send response
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

/**
 * params: /
 * description: create a pokemon
 * query:
 * method: post
 */

router.post("/", (req, res, next) => {
  //post input validation

  try {
    const { name, type1, type2 } = req.body;
    if (!name || !type1) {
      const exception = new Error(`Missing body info`);
      exception.statusCode = 401;
      throw exception;
    }

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    //post processing
    const newPokemon = {
      id:
        pokemons.reduce((maxId, pokemon) => Math.max(maxId, pokemon.id), 0) + 1,
      name,
      type1,
      type2: type2 || "",
    };

    //Add new pokemon to pokemon JS object
    pokemons.push(newPokemon);
    //Add new pokemon to db JS object
    db.pokemons = pokemons;
    //db JSobject to JSON string
    db = JSON.stringify(db);
    //write and save to pokemons.json
    fs.writeFileSync("pokemons.json", db);

    //post send response
    res.status(200).send(newPokemon);
  } catch (error) {
    next(error);
  }
});

/**
 * params: /
 * description: update a pokemon
 * query:
 * method: put
 */

router.put("/:pokemonId", (req, res, next) => {
  //put input validation

  try {
    const allowUpdate = ["name", "type1", "type2"];

    const { pokemonId } = req.params;

    const updates = req.body;
    const updateKeys = Object.keys(updates);
    //find update request that not allow
    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));

    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }
    //put processing
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    //Validate the pokemonId
    if (!pokemons.some((pokemon) => pokemon.id === parseInt(pokemonId))) {
      const exception = new Error(`Pokemon ID is not valid.`);
      exception.statusCode = 401;
      throw exception;
    }

    let currentPokemonIndex = pokemons.findIndex(
      (pokemon) => pokemon.id === parseInt(pokemonId)
    );

    //Update new content to db book JS object
    const updatedPokemon = { ...pokemons[currentPokemonIndex], ...updates };
    pokemons[currentPokemonIndex] = updatedPokemon;

    //db JSobject to JSON string

    db = JSON.stringify(db);
    //write and save to db.json
    fs.writeFileSync("pokemons.json", db);

    //put send response
    res.status(200).send(updatedPokemon);
  } catch (error) {
    next(error);
  }
});

/**
 * params: /
 * description: delete a pokemon
 * query:
 * method: delete
 */

router.delete("/:pokemonId", (req, res, next) => {
  //delete input validation

  try {
    const { pokemonId } = req.params;
    //delete processing
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    //Validate the pokemonId
    if (!pokemons.some((pokemon) => pokemon.id === parseInt(pokemonId))) {
      const exception = new Error(`Pokemon ID is not valid.`);
      exception.statusCode = 401;
      throw exception;
    }

    //filter db pokemons object
    db.pokemons = pokemons.filter(
      (pokemon) => pokemon.id !== parseInt(pokemonId)
    );

    //db JSobject to JSON string
    db = JSON.stringify(db);
    //write and save to db.json
    fs.writeFileSync("pokemons.json", db);

    //delete send response
    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});

module.exports = router;
