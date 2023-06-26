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

  const allowedFilter = ["Name", "Type1", "Type2", "page", "limit"];
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

router.get("/:pokemonId", (req, res, next) => {
  const { pokemonId } = req.params;

  //input validation

  try {
    //processing logic

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    //Validate the pokemonId
    if (parseInt(pokemonId) > pokemons.length || parseInt(pokemonId) === 0) {
      const exception = new Error(`Pokemon ID is not valid.`);
      exception.statusCode = 401;
      throw exception;
    }

    //Filter data by pokemon Id
    let result = [];

    let previousPokemonIndex =
      parseInt(pokemonId) === 1 ? pokemons.length - 1 : parseInt(pokemonId) - 2;

    let currentPokemonIndex = parseInt(pokemonId) - 1;

    let nextPokemonIndex =
      parseInt(pokemonId) === pokemons.length ? 0 : parseInt(pokemonId);

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
    //post processing

    const newPokemon = {
      name,
      type1,
      type2: type2 || "",
    };

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

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

module.exports = router;
