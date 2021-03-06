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

connection.connect(function (err) {
    if (err) throw err;
});

var start = function () {

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
        console.log(table.toString());
        purchase();
    })
}

var purchase = function () {

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
            message: "What item would you like to purchase?  Choose by <Item ID>"
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
            var chosenQuantity = answer.quantity
            if (chosenQuantity < result[itemID].stock_quantity) {
                console.log("Your total for " + "(" + answer.quantity + ")" + " - " + result[itemID].product_name + " is: " + result[itemID].price.toFixed(2) * chosenQuantity);
                connection.query("UPDATE products SET ? WHERE ?", [{
                    stock_quantity: result[itemID].stock_quantity - chosenQuantity
                }, {
                    item_id: result[itemID].item_id
                }], function (err, result) {

                    start();
                });

            } else {
                console.log("Sorry, maximum purchase of" + result[itemID].stock_quantity);
                start();
            }
        })

    }
    )
};


start();
