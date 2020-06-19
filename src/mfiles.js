/**
 * Initialise our data container
 *
 * @type {{}}
 */
window.mfiles = {};

/**
 * These store the parameters gleaned from the <script> tag
 * We need the VAULT ID when connecting and fetching the API token
 * We use the VIEW ID to set the directory that will be loaded and traversed
 *
 * @type {null}
 */
window.mfiles.vaultID = null;
window.mfiles.viewID  = null;

/**
 * Store the Auth token here
 *
 * @type {null}
 */
window.mfiles.authToken = null;

/**
 * Track the active level within the view hierarchy
 *
 * @type {number}
 */
window.mfiles.currentLevel = 0;

/**
 * Track the current active level
 *
 * @type {*[]}
 */
window.mfiles.viewArray = [];

/**
 * Track the request type (root, view, object)
 *
 * @type {null}
 */
window.mfiles.currentRequest = null;

/**
 * Track the current action
 *
 * @type {null}
 */
window.mfiles.currentAction = null;

/**
 * Track the current view ID
 *
 * @type {null}
 */
window.mfiles.currentView = null;

/**
 * Track the last open object URI - might come in handy for secondary requests etcetera
 *
 * @type {null}
 */
window.mfiles.lastObjectUri = null;

/**
 * When an object preview is requested, track the associated file here
 *
 * @type {null}
 */
window.mfiles.currentFile = null;

/**
 * Use this to temporarily store values we want to match with find()
 *
 * @type {null}
 */
window.mfiles.currentTestVal = null;

/**
 * Use these to track properties that have been displayed in the object view - prevents duplicates due to use multiple value (key) sources
 *
 * @type {*[]}
 */
window.mfiles.matchedProperties = null;
window.mfiles.currentProperty   = null;

/**
 * These functions below coulda woulda shouda been added inside the main jQuery() {} block below -  then they could reference $. instead of jQuery.
 */

/**
 * Reads the data value from the calling <script> TAG - allows implementation to define the parent View required for different areas of the site
 *
 * @returns {null|string}
 */
function getSyncScriptParams() {
    let scripts = document.getElementsByTagName('script');
    // ToDo: this may change !! we currently want the 2nd last script on the page !!
    let scriptName = scripts[scripts.length-2];
    return  scriptName.getAttribute('data-view-id');
}

/**
 * Sets the current level based on the current actions
 * We need to track the level for navigation
 *
 * @param action
 * @param level
 */
function setActiveLevel(action, level) {
    if (action) {
        window.mfiles.currentAction = action;
        if (action === 'home') {
            // always zero
            window.mfiles.currentLevel = 0;
        }
        if (action === 'down') {
            // we are drilling further down into the navigation hierarchy - increment the level up
            window.mfiles.currentLevel = window.mfiles.currentLevel + 1;
            //console.log("incremented window.mfiles.currentLevel = " + window.mfiles.currentLevel);
        }
        if (action === 'up') {
            if (window.mfiles.currentLevel > 0) {
                if (level) {
                    // breadcrumb nav elements will provide the destination level
                    window.mfiles.currentLevel = level;
                } else {
                    // this should trigger when the 'Up Arrow' is clicked
                    window.mfiles.currentLevel  = window.mfiles.currentLevel - 1;
                    //console.log("decremented window.mfiles.currentLevel = " + window.mfiles.currentLevel);
                }
            }
        }
    }
}

/**
 * Helper function for ~.find() -> used in setViewArrayValue()
 *
 * @param view
 * @returns {boolean}
 */
function checkViewId(view) {
    if (view) {
        if (view.id) {
            return view.id === window.mfiles.currentView;
        }
    }
    return false;
}

/**
 * Update the viewArray with actionable (recently followed path) viewID's
 *
 * @param viewID
 * @param action
 * @param title
 */
function setViewArrayValue( viewID, action, title ) {
    // track current view
    window.mfiles.currentView  = viewID;
    if (action === 'up') {
        // rebuild the array up to the new level
        let current = window.mfiles.viewArray,
            level   = window.mfiles.currentLevel,
            arr     = [],
            x;
        for (x in current) {
            if (x <= level) {
                arr[x] = window.mfiles.viewArray[ x ];
            }
        }
        window.mfiles.viewArray = arr;

    } else {
        // only update array if we are not loading the home view
        if (window.mfiles.currentLevel >= 1) {
            let views = window.mfiles.viewArray;
            if (views.find(checkViewId)) {
                return;
            }
            window.mfiles.viewArray[ window.mfiles.currentLevel ] = { title: title, id: viewID };
            return;
        }
        // home view = reset array
        window.mfiles.viewArray    = [];
        window.mfiles.viewArray[0] = { title: 'Home', id: window.mfiles.homeView };
    }

}

/**
 * Method generates the navigation breadcrumbs in the header
 */
function setHeaderViewCrumbs() {
    let rows = window.mfiles.viewArray,
        crumbs = '',
        spacer = ' / ',
        x;
    // console.log("rows length: " + rows.length);
    for (x in rows) {
        if (rows[x].hasOwnProperty('title')) {
            // checking for the title ensures we have valid data to work with
            if (x == 0) {
                // set the HOME icon then continue
                if (window.mfiles.currentLevel === 0) {
                    crumbs += '<img src="/images/icons/home.png" alt="' + rows[x].title + '" title="View: ' + rows[x].title + '" />';
                } else {
                    crumbs += '<a class="js-open-directory" data-action="home" href="#"><img src="/images/icons/home.png" alt="' + rows[x].title + '" title="' + rows[x].title + '" /></a>';
                }

            } else {
                // add the spacer
                crumbs += spacer;
                // determine if there are more crumbs after this next one
                let v = (parseInt(x) + 1);
                if (rows.length > v) {
                    // this crumb is  alink because its followed by another
                    crumbs += '<a class="js-open-directory" data-action="up" data-level="' + x + '" data-title="' + rows[x].title + '" data-view-id="' + rows[x].id + '" href="#">' + rows[x].title + '</a>';
                } else {
                    // this crumb is just a title - its the last
                    crumbs += rows[x].title;
                }
            }
        }
    }
    jQuery("#mfiles-crumbs").html(crumbs);
}

/**
 * Method sets the 'up arrow' into the header
 */
function setActionView() {
    if (window.mfiles.currentLevel >= 1) {
        // display UP Arrow
        jQuery("#mfiles-action").html('<img class="gc-up-arrow js-open-directory" data-action="up" src="/images/icons/up_arrow.png" />');
    } else {
        jQuery("#mfiles-action").html('');
    }
}

/**
 * Set the title for the Home icon after page load
 * The app does know whet the parent title is until it been loaded from the API
 *
 * @param title
 */
function setHomeTitle( title ) {
    window.mfiles.viewArray[0].title = title;
    // jQuery("#mfiles-crumbs img").attr('title', "View: " + title); // this is now handled in the breadcrumbs generator
}

/**
 * Method to build the URL to fetch item lists
 * Uses the viewArray which gets updated beforehand
 *
 * @param viewID
 * @returns {string}
 */
function buildURL( viewID ) {
    let views = window.mfiles.viewArray;
    let uri   = "http://gcmfiles/REST/views/",
        x;
    for (x in views) {
        if (views[x].hasOwnProperty('id')) {
            uri += views[x].id + '/';
        }
    }
    return uri + 'items.aspx';
}

/**
 * Sets the first row into the result set - count container
 */
function setContentCount() {
    jQuery("#mfiles-box").html('').append('<p class="mfiles-first"><span class="gc-count" id="mfiles-count"></span><span class="mfiles-waiting js-mfiles-waiting"><img alt="Waiting" src="/images/icons/ajax-loader.gif" /></span></p>');
}

/**
 * Method sets the correct item ID prefix for FolderContentItemType == 2
 *
 * @param dataType
 * @returns {string}
 */
function setDataTypePrefix( dataType ) {
    switch(dataType) {
        case 10:
            return 'M';
        case 9:
            return 'L';
        case 8:
            return 'B';
        case 7:
            return 'T';
        case 6:
            return 'T';
        case 5:
            return 'D';
        case 3:
            return 'F';
        case 2:
            return 'I';
        case 1:
            return 'T';
    }
    return 'V';
}

/**
 * Simple function to set the file type icon image name
 *
 * @param value
 * @returns {string}
 */
function setFileType( value ) {
    switch(value.toLowerCase()) {
        case 'csv':
            return 'csv';

        case 'docx':
        case 'doc':
        case 'txt':
            return 'doc';

        case 'htm':
        case 'html':
            return 'htm';

        case 'pdf':
            return 'pdf';

        case 'msg':
            return 'msg';

        case 'ppt':
        case 'pptx':
            return 'ppt';

        case 'pub':
            return 'pub';

        case 'vsd':
        case 'vsdx':
            return 'vsd';

        case 'xls':
        case 'xlsx':
            return 'xls';
    }
    return 'file';
}

/**
 * Functions used to detect clicks outside the active modal
 *
 * @param event
 */
const outsideClickListener = (event) => {
    let target = jQuery(event.target),
        selector = '#mfiles_modal';
    // we need to specify the target for closest() directly as its different to the modal selector
    if (!target.closest('.modal-dialog').length && jQuery(selector).is(':visible')) {
        jQuery(selector).hide();
        jQuery(".modal-backdrop").remove();
        removeClickListener();
    }
};
const removeClickListener = () => {
    //console.log("removing listener - outsideClickListener! ");
    document.removeEventListener('click', outsideClickListener);
};
function hideOnClickOutside(selector) {
    document.addEventListener('click', outsideClickListener);
}

/**
 * Clear unwanted elements
 */
function clearTheField() {
    jQuery(".js-invalid-response").remove();
}

/**
 * Helper functions for ~.find() => used in $.fn.setObjectProperties()
 *
 * @param prop
 * @returns {boolean}
 */
function findPropertyMatch( prop ) {
    if (prop) {
        if (prop.PropertyDef) {
            return (prop.PropertyDef === window.mfiles.currentProperty && prop.Required === true);
        }
    }
}
function findPropertyMatched( prop ) {
    if (prop) {
        return prop === window.mfiles.currentProperty;
    }
    return false;
}

/**
 * Only used for testing/setup to fetch a Vault list
 * Allows us to find a 'View ID' from the console
 *
 * @param token
 */
function getVaults(token) {
    jQuery.ajax({
        url: "http://gcmfiles/REST/server/vaults",
        type: "GET",
        dataType: "json",
        headers: {
            "X-Authentication":  token
        },
        success: (r) => {
            console.log(r);
        }
    });

    jQuery.ajax({
        url: "http://gcmfiles/REST/views/items.aspx",
        type: "GET",
        dataType: "json",
        headers: {
            "X-Authentication":  token
        },
        success: (r) => {
            console.log(r);
        }
    });
}

/** these functions were supposed to allow jQuery to handle stream downloads */
/*function base64ToArrayBuffer(base64) {
    let binaryString =  window.atob(base64);
    let binaryLen = binaryString.length;
    let bytes = new Uint8Array(binaryLen);
    for (let i = 0; i < binaryLen; i++)        {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
let saveByteArray = (function () {
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, name) {
        let blob = new Blob(data, {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());*/

/**
 * jQuery - drives the MFiles service views
 */
jQuery(function($) {
    /**
     * This method runs only on page load == we can use it to set all of our default and base values
     *
     * @param token
     */
    let getRootItems = function (token) {
        let viewID = getSyncScriptParams();
        console.log("view ID: " + viewID);
        if (viewID) {
            // save a reference to the HOME viewID
            window.mfiles.homeView = viewID;

            // for testing
            //getVaults(token);

            // we want to track the 3 different loading requests
            window.mfiles.currentRequest = 'root';
            setViewArrayValue( viewID );
            // set the header crumbs
            setHeaderViewCrumbs();
            setContentCount();
            $.ajax({
                url: "http://gcmfiles/REST/views/" + viewID + "/items.aspx",
                type: "GET",
                dataType: "json",
                headers: {
                    "X-Authentication":  token
                },
                success: processView
            });
        }
    };

    /**
     * This method runs whenever 'Open Directory', 'Up-arrow or Breadcrumbs' are clicked
     *
     * @param elm
     */
    $.fn.getViewItems = function (elm) {
        let viewID = $(elm).data('viewId') || window.mfiles.viewArray[0].id;
        let action = $(elm).data('action');
        // if action == up & currentLevel == 0 just return -> we cant go any higher
        if (action === 'up' && window.mfiles.currentLevel === 0) {
            return;
        }
        let level  = $(elm).data('level');
        let title  = $(elm).data('title') || '';

        // we want to track the 3 different loading requests
        window.mfiles.currentRequest = 'view';

        // track and set action and level
        setActiveLevel(action, level);
        setViewArrayValue(viewID, action, title);

        // this has to be run after the 2 previous function calls -> the URL builder uses the current viewArray to compose the URI
        let url = buildURL( viewID );

        //console.log("fetching items for ID: V" + viewID);
        //console.log("url: " + url);
        // clear & then set the content view count container
        setContentCount();
        // if we have a viewID
        if (viewID) {
            $.ajax({
                url: url,
                type: "GET",
                dataType: "json",
                headers: {
                    "X-Authentication":  window.mfiles.authToken
                },
                success: processView
            });
        }
    };

    /**
     * !! Need this method to run our modal and fetch data - too many issues with Mootools mucking shite up !!
     * This method fetches an objects data properties for the modal view
     *
     * @param elm
     */
    $.fn.getObjectItem = function ( elm ) {
        let id    = $(elm).data('objectId');
        let ver   = $(elm).data('objectVersion');
        let title = $(elm).data('title') || '';

        // track the file data
        window.mfiles.currentFile      = { id: null, guid: null, name: null, ext: null };
        window.mfiles.currentFile.id   = $(elm).data('fileId');
        window.mfiles.currentFile.guid = $(elm).data('fileGuid');
        window.mfiles.currentFile.name = title;
        window.mfiles.currentFile.ext  = $(elm).data('fileExtension');
        window.mfiles.currentRequest   = 'object';

        // open des modalski
        $('body').append('<div class="modal-backdrop  in"></div>');
        $("#mfiles_modal").toggle();
        $(".js-mfiles-title").html('<h4>' + title + '</h4>');
        $(".js-mfiles-properties").html('');

        // fetching the dataeskski
    //    let url = 'http://gcmfiles/REST/objects/0/' + id + '/' + ver + '/properties.aspx?iconClues=true&include=properties';
        window.mfiles.lastObjectUri = 'http://gcmfiles/REST/objects/0/' + id + '/' + ver;
        let url = 'http://gcmfiles/REST/objects/0/' + id + '/' + ver + '/properties.aspx?iconClues=true&include=properties';
        $.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            headers: {
                "X-Authentication":  window.mfiles.authToken
            },
            //. handooff the rendering to another function
            success: $.fn.setObjectProperties
        });

        // closing the modalski
        $("#mfiles-cancel-download").on('click', function() {
            $("#mfiles_modal").hide();
            $(".modal-backdrop").remove();
            // dont forget this!!
            document.removeEventListener('click', outsideClickListener);
        });
        setTimeout(function() {
            hideOnClickOutside("#mfiles_modal");
        }, 100);

        // file download button listener
        $("#mfiles-download-file").on('click', function() {
            $.fn.downloadFile();
        });
    };

    /**
     * Populates the file properties preview
     *
     * @param prop
     */
    $.fn.setObjectProperties = function( properties ) {
        // row styling
        let index = 1,
            prop = null,
            source = '',
            person = '',
            classDone = null,
            createdDone = null,
            modifiedDone = null;
        window.mfiles.matchedProperties = [];
        // first display the Class, Created and Modified values // prop.PropertyValues
        prop = properties;
        if (properties.PropertyValues) {
            prop = properties.PropertyValues
        }
        prop.forEach((p) => {
            let text = '';
            if (p.Value) {
                text = p.Value.DisplayValue;
            } else {
                text = p.TypedValue.DisplayValue;
            }
            if (p.PropertyDef === 25) {
                source = text;
            }
            if (p.PropertyDef === 23 || p.PropertyDef === 21) {
                person = text;
            }
        });
        prop.forEach((p) => {
            if (p.PropertyDef === 100 && classDone === null) {
                let style = index % 2 ? 'even' : 'odd';
                let text  = '';
                if (p.Value) {
                    text = p.Value.DisplayValue;
                } else {
                    text = p.TypedValue.DisplayValue
                }
                classDone = true;
                $(".js-mfiles-properties").append('<p class="mfiles-property ' + style + '"><span class="property-title">Class</span> <span class="property-value">' + text + '</span></p>')
                index++;
                window.mfiles.matchedProperties.push(100);
            }
        });
        prop.forEach((p) => {
            if (p.PropertyDef === 20 && createdDone === null) {
                let style = index % 2 ? 'even' : 'odd';
                let text  = '';
                if (p.Value) {
                    text = p.Value.DisplayValue;
                } else {
                    text = p.TypedValue.DisplayValue
                }
                createdDone = true;
                $(".js-mfiles-properties").append('<p class="mfiles-property ' + style + '"><span class="property-title">Created</span> <span class="property-value">' + text + ' ' + source + '</span></p>')
                index++;
                window.mfiles.matchedProperties.push(20);
            }
        });
        prop.forEach((p) => {
            if ((p.PropertyDef === 89 || p.PropertyDef === 21) && modifiedDone === null) {
                let style = index % 2 ? 'even' : 'odd';
                let text  = '';
                if (p.Value) {
                    text = p.Value.DisplayValue;
                } else {
                    text = p.TypedValue.DisplayValue
                }
                modifiedDone = true;
                if (person.indexOf('(') == -1) {
                    person = "(" + person + ")";
                }
                $(".js-mfiles-properties").append('<p class="mfiles-property ' + style + '"><span class="property-title">Last modified</span> <span class="property-value">' + text + ' ' + person + '</span></p>')
                index++;
                if (p.PropertyDef === 89) {
                    window.mfiles.matchedProperties.push(89);
                }
                if (p.PropertyDef === 21) {
                    window.mfiles.matchedProperties.push(21);
                }
            }
        });
        prop.forEach((p) => {
            if (p.PropertyDef === 34) {
                let style = index % 2 ? 'even' : 'odd';
                let text  = '';
                if (p.Value) {
                    text = p.Value.DisplayValue;
                } else {
                    text = p.TypedValue.DisplayValue
                }
                $(".js-mfiles-properties").append('<p class="mfiles-property ' + style + '"><span class="property-title">Traditional folder</span> <span class="property-value">' + text + '</span></p>')
                index++;
                window.mfiles.matchedProperties.push(34);
            }
        });
        prop.forEach((p) => {
            if (p.PropertyDef === 26 && p.TypedValue.HasValue === true) {
                let style = index % 2 ? 'even' : 'odd';
                let text  = '';
                if (p.Value) {
                    text = p.Value.DisplayValue;
                } else {
                    text = p.TypedValue.DisplayValue
                }
                $(".js-mfiles-properties").append('<p class="mfiles-property ' + style + '"><span class="property-title">Keywords</span> <span class="property-value">' + text + '</span></p>')
                index++;
                window.mfiles.matchedProperties.push(26);
            }
        });
        // we need to fetch the classes list first
        $.ajax({
            url: 'http://gcmfiles/REST/structure/classes.aspx?PropertyDef=100',
            type: "GET",
            dataType: "json",
            headers: {
                "X-Authentication":  window.mfiles.authToken
            },
            success: (res) => {
                res.forEach((r) => {
                    let namePropertyDef   = r.NamePropertyDef;
                    let matchedProps = window.mfiles.matchedProperties;
                    prop.forEach((p) => {
                        window.mfiles.currentProperty = p.PropertyDef;
                        let matched = matchedProps.find(findPropertyMatched);
                        if (namePropertyDef !== 0 && p.PropertyDef === namePropertyDef && !matched) {
                            //console.log("processing propertyDef: " + p.PropertyDef);
                            // track
                            window.mfiles.matchedProperties.push(p.PropertyDef);
                            let style = index % 2 ? 'even' : 'odd';
                            let text  = '';
                            if (p.Value) {
                                text = p.Value.DisplayValue;
                            } else {
                                text = p.TypedValue.DisplayValue
                            }
                            // we have matching name and property pair
                            $(".js-mfiles-properties").append('<p class="mfiles-property ' + style + '"><span class="property-title">' + r.Name + '</span> <span class="property-value">' + text + '</span></p>')
                            index++;
                        }
                    });
                });
                //console.log("classes processing finished...");

                // now try the values // window.mfiles.lastObjectUri url: 'http://gcmfiles/REST/structure/valuelists.aspx', // url: 'http://gcmfiles/REST/structure/properties', 'http://gcmfiles/REST/structure/classes.aspx?PropertyDef=100'
                // 'http://gcmfiles/REST/structure/classes.aspx?PropertyDef=100' 'http://gcmfiles/REST/structure/objecttypes'
                // 'http://gcmfiles/REST/structure/classes/51' 'http://gcmfiles/REST/structure/classes/26'
                /*$.ajax({
                    url: 'http://gcmfiles/REST/structure/properties/30',
                    type: "GET",
                    dataType: "json",
                    headers: {
                        "X-Authentication":  window.mfiles.authToken
                    },
                    success: (res) => {
                        console.log(res);

                        res.forEach((r) => {
                            let namePropertyDef   = r.NamePropertyDef;
                            let matchedProps      = window.mfiles.matchedProperties;
                            //let assocPropertyDefs = [];//r.AssociatedPropertyDefs;

                            // check the props for a match
                            let style = index % 2 ? 'even' : 'odd';

                            prop.forEach((p) => {
                                window.mfiles.currentProperty = p.PropertyDef;
                                let matched = matchedProps.find(findPropertyMatched);
                                /!*if (matched) {
                                    console.log(p.PropertyDef + " matched2 = " + matched);
                                }*!/
                                if ((namePropertyDef !== 0 && p.PropertyDef === namePropertyDef) && !matched) {
                                    console.log("namePropertyDef2: " + namePropertyDef + ' = ' + p.PropertyDef);
                                    let text  = '';
                                    if (p.Value) {
                                        text = p.Value.DisplayValue;
                                    } else {
                                        text = p.TypedValue.DisplayValue
                                    }
                                    // we have matching name and property pair
                                    $(".js-mfiles-properties").append('<p class="mfiles-property ' + style + '"><span class="property-title">' + r.Name + '</span> <span class="property-value">' + text + '</span></p>')
                                    index++;
                                } else {
                                    if (p.Value) {
                                        if (p.Value.Lookups) {
                                            if (p.Value.Lookups[0].Item) {

                                            }
                                        }
                                    }
                                }
                            });
                        });
                    }
                });*/
                /**
                 * Now iterate through the props and look for as matching object with a name (key) value
                 */
                prop.forEach((p) => {
                    window.mfiles.currentProperty = p.PropertyDef;
                    let matchedProps = window.mfiles.matchedProperties;
                    let matched      = matchedProps.find(findPropertyMatched);
                    if (p.PropertyDef !== 0 && !matched) {
                        let id = p.PropertyDef;
                        //console.log("fetching property for: " + id);
                        $.ajax({
                            url: 'http://gcmfiles/REST/structure/properties/' + id,
                            type: "GET",
                            dataType: "json",
                            headers: {
                                "X-Authentication": window.mfiles.authToken
                            },
                            success: (res) => {
                                if ( res.Name && res.Name.length >= 1) {
                                    //console.log("name found: " + res.Name);
                                    let key = res.Name;
                                    let text  = '';
                                    let style = index % 2 ? 'even' : 'odd';
                                    if (p.Value) {
                                        text = p.Value.DisplayValue;
                                    } else {
                                        text = p.TypedValue.DisplayValue
                                    }
                                    if (text.length >= 1) {
                                        //console.log("showing key: " + key + " text: " + text);
                                        // key and text values to display
                                        $(".js-mfiles-properties").append('<p class="mfiles-property ' + style + '"><span class="property-title">' + key + '</span> <span class="property-value">' + text + '</span></p>');
                                        index++;
                                    }
                                }
                            }
                        })
                    }
                });
            }
        });
    };

    /**
     * Method to download the selected file using JavaScript
     * jQuery would not handle the task on its own - reverted to basic XMLHttpRequest
     */
    $.fn.downloadFile = function() {
        // let the user know
        $(".js-mfiles-properties").html('<br/><p class="mfiles-download text-center"><strong>Fetching the file, please wait...</strong></p><p class="mfiles-download text-center"><img alt="Waiting" src="/images/icons/loading.gif" /></p><br/>');

        let url = window.mfiles.lastObjectUri + '/files/' + window.mfiles.currentFile.id + '/content';
        let req = new XMLHttpRequest();
        // !! only GET works here !!
        req.open("GET", url, true);
        req.responseType = "blob";
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        // !! need this !!
        req.setRequestHeader("X-Authentication", window.mfiles.authToken);
        req.send(null);
        req.onreadystatechange = function() {
            // Optional: call a function when the state changes.
            if (req.readyState === 4 && req.status === 200) {
                // we can track the response
                //console.log(req.response);
            }
        };
        req.onload = function (event) {
            let blob        = req.response;
            // console.log(blob.size);
            let date        = new Date();
            let ts          = "_" + date.getTime();
            let fileName    = window.mfiles.currentFile.name + ts + "." + window.mfiles.currentFile.ext;
            let link        = document.createElement('a');

            link.href       = window.URL.createObjectURL(blob);
            link.download   = fileName.replace(" ", "_").replace("+", "");
            link.click();

            // update user
            setTimeout(function() {
                $(".js-mfiles-properties").html('<br/><p class="text-center"><strong>Download complete...</strong></p><p>&nbsp;</p><br/>');
            }, 750);
            setTimeout(function() {
                $(".js-mfiles-properties").html('<br/><p class="text-center"><strong>Closing...</strong></p><p>&nbsp;</p><br/>');
            }, 3000);

            // close the modal
            setTimeout(function() {
                $("#mfiles-cancel-download").click();
                $(".modal-backdrop").remove();
            }, 4000);
        };
    };

    $.fn.showMultiFiles = function(elm) {
        // close all open elements
        $(".js-files-display").each(function() {
            $(this).hide();
        });
        let target = $(elm).data('filesId');
        //console.log("showing: " + target);
        $("#" + target).show();
    };

    /**
     * Place any listeners that we want on page load here
     */
    $.fn.setListeners = function(multi) {
        $(".js-open-directory").on('click', function() {
           $.fn.getViewItems(this);
        });
        $(".js-open-object").on('click', function() {
            $.fn.getObjectItem(this);
        });
        if (multi === true) {
            $(".js-show-files").on('click', function() {
               $.fn.showMultiFiles(this);
            });
        }
    };

    /**
     * Handle any AJAX error events
     */
    $(document).ajaxError(function(event, request, setting) {
        if (window.mfiles.currentRequest && window.mfiles.currentRequest === 'view') {
            //console.log(event);
            $('.js-mfiles-waiting').remove();
            $("#mfiles-box").append('<p class="js-invalid-response">Error: invalid request detected</p>');
        }
    });

    /**
     * Function used to display the view contents
     *
     * @param folderContents
     */
    let processView = function (folderContents) {
        // the wait is over !!
        $(".js-mfiles-waiting").remove();
        // if this is the top level update the home title
        if (window.mfiles.currentLevel === 0) {
            setHomeTitle( folderContents.viewPathInfos[0].ViewName );
        }
        // set the header crumbs
        setHeaderViewCrumbs();
        // total item counter
        let count = 0,
            multi = false;
        // iterate the results
        $.each( folderContents.Items, function (i, item) {
            if (item.FolderContentItemType === 1) {
                // real directory
                $("#mfiles-box").append('<p class="mfiles-row"><span class="gc-icon"><img src="/images/icons/directory-icon.jpg" /> ' + item.View.Name + '</span><span class="btn gc-open float-right js-open-directory" data-action="down" data-view-id="V' + item.View.ID + '" data-title="' + item.View.Name + '">Open directory</span></p>');
                count++;
            }
            if (item.FolderContentItemType === 2) {
                // virtual directory
                $("#mfiles-box").append('<p class="mfiles-row"><span class="gc-icon"><img src="/images/icons/directory-icon.jpg" /> ' + item.PropertyFolder.DisplayValue + '</span><span class="btn gc-open float-right js-open-directory" data-action="down" data-view-id="' + setDataTypePrefix(item.PropertyFolder.DataType) + item.PropertyFolder.SerializedValue + '" data-title="' + item.PropertyFolder.DisplayValue + '">Open directory</span></p>');
                count++;
            }
            if (item.FolderContentItemType === 3) {
                // traditional folder / directory
                $("#mfiles-box").append('<p class="mfiles-row"><span class="gc-icon"><img src="/images/icons/directory-icon.jpg" /> ' + item.TraditionalFolder.DisplayValue + '</span><span class="btn gc-open float-right js-open-directory" data-action="down" data-view-id="Y' + item.TraditionalFolder.Item + '" data-title="' + item.TraditionalFolder.DisplayValue + '">Open folder</span></p>');
                count++;
            }
            if (item.FolderContentItemType === 4) {
                // different views for single and multiple files scenarios
                if (item.ObjectVersion.SingleFile === true) {
                    // single file
                    $("#mfiles-box").append('<p class="mfiles-row"><span class="gc-icon"><img alt="File icon" title="File type ' + item.ObjectVersion.Files[0].Extension + '" src="/images/icons/' + setFileType(item.ObjectVersion.Files[0].Extension) + '.jpg" /> ' + item.ObjectVersion.Title + '</span><span class="btn gc-open gc-open-file float-right js-open-object" data-target="#mfiles_modal" data-file-id="' + item.ObjectVersion.Files[0].ID + '" data-file-extension="' + item.ObjectVersion.Files[0].Extension + '" data-file-guid="' +  item.ObjectVersion.Files[0].FileGUID + '" data-object-id="' + item.ObjectVersion.DisplayID + '" data-object-version="' + item.ObjectVersion.LatestCheckedInVersion + '" data-title="' + item.ObjectVersion.Title + '">Preview file</span></p>');
                } else {
                    // multiple files - indented view
                    multipleFileView(item);
                    multi = true;
                }
                count++;
            }
        });
        $("#mfiles-count").text("Total items found: " + count);
        setActionView();
        $.fn.setListeners(multi);
    };

    /**
     * Function used to handle the multiple file display
     *
     * @param item
     */
    let multipleFileView = function( item ) {
        $("#mfiles-box").append('<p class="mfiles-row gc-go-multi"><span class="gc-icon gc-icon-open js-show-files" data-files-id="files-display-' + item.ObjectVersion.DisplayID + '"><img alt="Open folder icon" title="Multiple file container - click to view files" src="/images/icons/open-directory.jpg" /> ' + item.ObjectVersion.Title + '<span class="gc-open-files gc-open-files-list">View files</span></span><span id="files-display-' + item.ObjectVersion.DisplayID + '" class="gc-files-indent js-files-display"></span></p>');
        let files = item.ObjectVersion.Files,
            target = "files-display-" + item.ObjectVersion.DisplayID;
        files.forEach((f) => {
            $("#" + target).append('<span class="gc-file-wrapper"><span class="gc-icon"><img alt="File icon" title="File type ' + f.Extension + '" src="/images/icons/' + setFileType(f.Extension) + '.jpg" />  ' + f.Name + '</span><span class="btn gc-open-file float-right js-open-object" data-target="#mfiles_modal" data-file-id="' + f.ID + '" data-file-extension="' + f.Extension + '" data-file-guid="' +  f.FileGUID + '" data-object-id="' + item.ObjectVersion.DisplayID + '" data-object-version="' + item.ObjectVersion.LatestCheckedInVersion + '" data-title="' + f.Name + '">Preview file</span></span>');
        });
    };

    /**
     * Handle the returned token, then make the initial call to fetch and render the root view
     *
     * @param token
     */
    const processToken = function (token) {
        // Set the header.
        $.ajaxSetup({ headers: { "X-Authentication" : token.Value } });
        window.mfiles.authToken = token.Value;
        getRootItems(token.Value);
    };

    /**
     * This is the apps initialising function - only runs on first load of the page
     *
     * @param username
     * @param password
     * @param vault
     */
    const getToken = function (username, password, vault) {
        // set the waiting gif - sometimes the first load takes a few moments
        $("#mfiles-box").append('<p style="text-align: center"><img style="margin: auto" src="/images/icons/loading.gif" /></p>');
        // Request an encrypted token with the login information.
        $.ajax({
            url: "http://gcmfiles/REST/server/authenticationtokens.aspx",
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify({Username: username, Password: password, VaultGuid: vault}),
            success: processToken
        });
    };

    /**
     * ToDo: change the MFiles username here to match your RESTful API service user
     * check the applications main template for declared const value (mfilesuser) 
     */
    getToken('mfilesusername', mfilesuser, '7FDE2E30-E629-46AD-9236-71BA7AD9C095');

});
