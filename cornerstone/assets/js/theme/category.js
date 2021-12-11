import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import { createTranslationDictionary } from '../theme/common/utils/translations-utils';

export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
        $element.attr({
            role: roleType,
            'aria-live': ariaLiveStatus,
        });
    }

    makeShopByPriceFilterAccessible() {
        if (!$('[data-shop-by-price]').length) return;

        if ($('.navList-action').hasClass('is-active')) {
            $('a.navList-action.is-active').focus();
        }

        $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
    }

    onReady() {
        this.arrangeFocusOnSortBy();

        $('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

        this.ariaNotifyNoProducts();
    }

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.focus();
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }
}


/*Changes for the introduction technical*/

window.onload = function(){
    getCart().then((json) => {
        if(json.length != 0){
            $("#remove-all-special").css('display','inline-block');
        }
    })
}

/*Helper functions using Salesforce API*/

/*Creates a cart with given cart items*/
function createSpecialCart(cartItems){
    const url = "/api/storefront/carts";
    return fetch(url,{
        method:"POST",
        credentials: "same-origin",
        headers: {"Content-Type":"application/json"},
        body:JSON.stringify(cartItems)
    })
    .then(response=> response.json());
}

/*Gets the current cart of the user*/
function getCart() {
   return fetch("/api/storefront/carts?include=lineItems.digitalItems.options,lineItems.physicalItems.options", {
        method: "GET",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json"
        }
   })
   .then(response => response.json());
}

/*Deletes the entire current cart of the user. This deletes items other than the Special Item*/
function deleteCart(cartID){
    return fetch('/api/storefront/carts/' + cartID, {
        method: "DELETE",
        credentials: "same-origin",

        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin" : "*", 
            "Access-Control-Allow-Credentials" : true 
        }
    })
    .then(response => console.log(response));
}

/*Adds a given item to the given cart. This happens when the cart already contains an item*/
function addSpecialItem(cartID, cartItems){
    return fetch(url + cartId + '/items', {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json"},
        body: JSON.stringify(cartItems),
     })
    .then(response => response.json());
}

/*Click Events for the Add All to Cart Button, and the Remove All Button*/

$("#add-all-special").click(function() {
    getCart().then((json) => {
        if(typeof json[0] === 'undefined'){
            return createSpecialCart({"lineItems":[{"quantity":1,"productId":112}]});
        } else {
            return addSpecialItem(json[0].id,{"lineItems":[{"quantity":1,"productId":112}]});
        }
    })
    .then(response => {window.alert("The Special Item has been added to the cart"); return window.location = "/cart.php"})
    .catch(error => console.log(error));
});


$("#remove-all-special").click(function(){
    getCart().then((json) => {
        if(json[0].id != undefined){
            return deleteCart(json[0].id);
        }
    })
    .then(response => {window.alert("Your cart has been emptied of all items"); return window.location = "/cart.php"})
    .catch(error => console.log(error));

});
