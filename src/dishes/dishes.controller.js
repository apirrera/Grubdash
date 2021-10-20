const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function checkDishData(Info) {
  return (req, res, next) => {
    const { data = {} } = req.body;
    const value = data[Info];
    if (value) {
      return next();
    }
    next({ status: 400, message: `Dish must have a ${Info}` });
  };
}

const DishName = checkDishData("name");
const DishDescription = checkDishData("description");
const DishImage = checkDishData("image_url");

function priceGreaterThanZero(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (Number.isInteger(price) && price > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Dish price has to be larger than 0",
  });
}

function routeIdBodyId(req, res, next) {
  const dishId = req.params.dishId;
  const { id } = req.body.data;
  if (!id || id === dishId) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id doesn't match route id. The Dish ${id} is set to the Route ${dishId}`,
  });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `The Dish id ${dishId} doesn't exist`,
  });
}
//create, read, update, and list section

function create(req, res) {
  const dish = req.body.data;
  dish.id = nextId();
  dishes.push(dish);
  res.status(201).json({ data: dish });
}

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const { id } = res.locals.dish;
  Object.assign(res.locals.dish, req.body.data, { id });
  res.json({ data: res.locals.dish });
}

module.exports = {
  create: [
    DishName,
    DishDescription,
    priceGreaterThanZero,
    DishImage,
    create,
  ],
  list,
  read: [
    dishExists, 
    read],
  update: [
    dishExists,
    routeIdBodyId,
    DishName,
    DishDescription,
    priceGreaterThanZero,
    DishImage,
    update,
  ],
};