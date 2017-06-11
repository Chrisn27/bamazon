var inquirer = require('inquirer');
var fs = require('fs');
var mysql = require('mysql');
var Table = require('cli-table');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
});

connection.connect(function(err, result) {
    if (err) throw err;
    start();
});

var start = function () {

    inquirer.prompt([
        {
            name: "choice",
            type: "list",
            choices: ["View products for sale", "View low inventory", "Add to Inventory", "Add New Product"],
            message: "What would you like to do, Mr. Manager?  It's just manager"

        }
    ]).then(function(answer) {

        if (answer.choice === "View products for sale") {
            products();
        }

        if (answer.choice === "View low inventory") {
            low();
        }
        if (answer.choice === "Add to Inventory") {
            add();
        }
        if (answer.choice === "Add New Product") {
            newProduct();
        }
    })

}

var products = function() {
    connection.query('SELECT * FROM products', function (err, result) {
        if (err) console.log(err);

        var table = new Table({
            head: ['Item Id', 'Product Name', 'Deparment', 'Price', 'In Stock'],
            style:
            {
                head: ['green'],
                compact: false,
                colAligns: ['center'],
            }
        });

        for (var i = 0; i < result.length; i++) {
            table.push([result[i].item_id, result[i].product_name, result[i].department_name, result[i].price, result[i].stock_quantity]);
        }
        console.log("Our current inventory")
        console.log(table.toString());
        start();
    })
};


var low = function() {

    var query = "SELECT product_name, stock_quantity FROM products WHERE stock_quantity < 6";
    connection.query(query, function (err, res) {

        if (0 === res.length) {
            console.log("We have at least 5 of everything boss");
        } else {
            for (var i = 0; i < res.length; i++) {
                console.log(res[i].product_name + " | " + res[i].stock_quantity);
            }
            var table = new Table({
                head: ['Product Name', 'In Stock'],
                style:
                {
                    head: ['green'],
                    compact: false,
                    colAligns: ['center'],
                }
            });

            for (var i = 0; i < res.length; i++) {
                table.push([res[i].product_name, res[i].stock_quantity]);
            }
            console.log("Our current inventory")
            console.log(table.toString());
        }
        start();
    });

};

var add = function() {

    connection.query('SELECT * FROM products', function (err, result) {

        if (err) console.log(err);

        inquirer.prompt([{
            name: "itemID",
            type: "list",
            choices: function () {
                var choiceArray = [];
                for (var i = 0; i < result.length; i++) {
                    choiceArray.push([result[i].item_id].toString());
                }
                return choiceArray;
            },
            message: "Which product would you like to restock?  Choose by <Item ID>"
        }, {
            name: "quantity",
            type: "input",
            message: "How many of this item would you like to buy?",
            validate: function (value) {
                if (isNaN(value) == false) {
                    return true;
                } else {
                    return false;
                }
            }
        }]).then(function (answer) {
            var itemID = answer.itemID - 1
            var chosenProduct = result[itemID]
            var chosenQuantity = parseFloat(answer.quantity)

            connection.query("UPDATE products SET ? WHERE ?", [{
                stock_quantity: result[itemID].stock_quantity + chosenQuantity
            }, {
                item_id: result[itemID].item_id
            }], function (err, result) {

                start();
            });


        })

    })
};

var newProduct = function() {

    connection.query('SELECT * FROM products', function(err, result) {

        if (err) console.log(err);

        inquirer.prompt([
            {
                name: "name",
                type: "input",
                message: "What is the products name",
            },
            {
                name: "department",
                type: "input",
                message: "What is the department name?"

            },
            {
                name: "price",
                type: "input",
                message: "What does each unit cost?"
            },
            {
                name: "stock",
                type: "input",
                message: "How many should we buy?"
            }

        ]).then(function (answer) {
            connection.query("INSERT INTO products SET ?", {
                product_name: answer.name,
                department_name: answer.department,
                price: answer.price,
                stock_quantity: answer.stock
            }, function (err, res) {
                console.log("Added " + answer.stock + " " + answer.name + " to inventory")
                start();
            });
        })
    })
};