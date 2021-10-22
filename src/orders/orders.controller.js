const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//middleware section

//This checks the order properties else it returns an error if there is no properties
  function propertiesExist(property) {
    return (req, res, next) => {
      const { data = {} } = req.body;
      const value = data[property];
      if (value) {
        return next();
      }
      next({ status: 400, message: `Order must include a ${property}` });
    };
  }

  //Here the properties are defined
  const deliverToProperty = propertiesExist("deliverTo");
  const mobileNumberProperty = propertiesExist("mobileNumber");
  const dishesProperty = propertiesExist("dishes");

  //This checks the quantity of the order, there should be at least one dish and within that dish the quantity must be greater than zero
  function checkQuantity(req,res,next){
    const data = req.body.data || {};
  
  const dishes = data.dishes;
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Dish must include at least one dish",
    });
  }

  dishes.forEach((dish, index) => {
    if (
      !Number.isInteger(dish.quantity) ||
      dish.quantity < 0 ||
      !dish.quantity
    ) {
      return next({
        status: 400,
        message: `Dish ${index} needs a number quantity greater than zero.`,
      });
    }
  });
  res.locals.data = data;
  next();
}

//This checks that the order exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const order = orders.find((order) => order.id === orderId);
  if (order === undefined) {
    return next({
      status: 404,
      message: `${orderId} order doesn't exist`,
    });
  }
  res.locals.order = order;
  next();
}

//This validates: That the order id matches the routeid and that the order has a status
function validateID(req, res, next) {
  const { data: { id, status } = {} } = req.body;
  const { orderId } = req.params;

  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Orderid: ${id} does not match Routeid: ${orderId}`,
    });
  }
  if (
    !status ||
    !["pending", "preparing", "out-for-delivery", "delivered"].includes(status)
  ) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered.",
    });
  }
  next();
}

//This validates that an order can't be deleted in pending status
function statusValid(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: `Can't delete with ${order.status} because it must be pending`,
    });
  }
  next();
}

//create, read, update, destroy, and list section

//list
function list(req, res) {
  res.json({ data: orders });
};

//create
function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };

  orders.push(newOrder);

  res.status(201).json({ data: newOrder });
};

//read

function read(req, res) {
  res.json({ data: res.locals.order });
};

//update
function update(req, res) {
  const { id } = res.locals.order;
  Object.assign(res.locals.order, req.body.data, { id });
  res.json({ data: res.locals.order });
}

//delete
function destroy(req, res) {
  const index = orders.findIndex((order) => order.id === res.locals.order);
  orders.splice(index, 1);
  res.sendStatus(204);
}


module.exports = {
  list,
  create: [checkQuantity,deliverToProperty,
    mobileNumberProperty,
    dishesProperty, create],
  read: [orderExists, read],
  update: [checkQuantity,orderExists, deliverToProperty,
    mobileNumberProperty,
    dishesProperty, validateID, update],
  delete: [orderExists, statusValid, destroy],
};