const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass


//This checks that dishes have all the required information
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

//Here the dish information is defined
const DishName = checkDishData("name");
const DishDescription = checkDishData("description");
const DishImage = checkDishData("image_url");

//This makes sure that the price is more than 0 dollars
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

//This validates that the dish id matches the route id
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

//This finds the dish id else it gives an error that the dish doesn't exist
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

//create
function create(req, res) {
  const dish = req.body.data;
  dish.id = nextId();
  dishes.push(dish);
  res.status(201).json({ data: dish });
}

//list
function list(req, res) {
  res.json({ data: dishes });
}

//read
function read(req, res) {
  res.json({ data: res.locals.dish });
}

//update
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