
/**
 * Function used by the importer plugin to create importer dialog.
 * @param timetable Timetable object used to specify import destination
 */
function createIctpImporterDialog(timetable){
    new ImportIctpDialog(timetable);
};

type("UploadXlsFileDialog", ["ExclusivePopupWithButtons"], {

    _getButtons: function() {
        var self = this;
        return [
            [$T('Upload'), function() {
                if (self.pm.check()) {
                    self.killProgress = IndicoUI.Dialogs.Util.progress($T('Uploading...'));
                    self.uploading = true;
                    $(self.form.dom).submit();
                }
            }],
            [$T('Cancel'), function() {
                self.close();
            }]
        ];
    },

    _fileUpload: function() {
        var self = this;
        var pm = self.pm = new IndicoUtil.parameterManager();
        var uploadType = Html.input('hidden', {name: 'uploadType'});
        var file = Html.input('file', {name: 'file'});

        uploadType.set('file');

        pm.add(file, 'text', false);
        
        this.form = Html.form({
                            method: 'post',
                            id: Html.generateId(),
                            action: build_url(this.uploadAction, this.args),
                            enctype: 'multipart/form-data',
                            encoding: 'multipart/form-data'
                        },
                        Html.input('hidden', {name: 'conference'}, this.args.conference),
                        IndicoUtil.createFormFromMap(
                            [
                                [$T('File'), file],
                            ]).get(),
                        uploadType);

        $(this.form.dom).ajaxForm({
            dataType: 'json',
            iframe: true,
            complete: function(){
                self.killProgress();
            },
            success: function(resp){
                if (resp.status == "ERROR") {
                    IndicoUtil.errorReport(resp.info);
                } else {
                    self.close();
                    self.query.dom.value = JSON.stringify(resp.info);
                    self.onUpload();
                }
            }
        });

        return Html.div({}, this.form);
},


    draw: function() {
        return this.ExclusivePopupWithButtons.prototype.draw.call(this, this._fileUpload());
    }
}, function(title, args, width, height, types, uploadAction, onUpload, query) {
    var self = this;
    this.title = title;
    this.width = width;
    this.height = height;
    this.types = types;
    this.uploadAction = uploadAction;
    this.uploading = false;
    this.onUpload = onUpload;
    this.query = query;

    this.args = clone(args);
    this.ExclusivePopupWithButtons($T(title));
});





type("ImportIctpDialog", ["ExclusivePopupWithButtons", "PreLoadHandler"],
        {
            _preload:[
                      /**
                       * Loads a list of importers from the server.
                       */
                      function(hook){
                          var self = this;
                          indicoRequest('importer.getImporters',{},
                                  function(result, error){
                                        if(!error)
                                            self.importers = result;
                                        hook.set(true);
                          });
                      }
            ],
            /**
             * Hides importer list and timetable list and shows information to type a new query.
             */
            _hideLists: function(){
                this.importerList.hide();
                this.emptySearchDiv.show();
            },
            /**
             * Shows importer list and timetable list and hides information to type a new query.
             */
            _showLists: function(){
                this.importerList.show();
                //this.timetableList.refresh();
                //this.timetableList.show();
                this.emptySearchDiv.hide();
            },
            /**
             * Draws the content of the dialog.
             */
            drawContent : function(){
                var self = this;
                var search = function() {
                        self.importerList.search(query.dom.value, importFrom.dom.value, 20, [function(){
                            self._showLists();
                        }]);
                    };
                var searchButton = Html.input('hidden',{}, $T('search'));
                searchButton.observeClick(search);
                var importFrom = Html.select({});
                for( importer in this.importers )
                    importFrom.append(Html.option({value:importer}, this.importers[importer]));
                var query = Html.input('hidden', {});
                query.observeEvent('keypress', function(event){
                    if( event.keyCode == 13 )
                        search();
                });
                this.query = query;
                
                this.emptySearchDiv = new PresearchContainer(this.height, function(){
                    self._showLists();
                });
                /**
                 * Enables insert button whether some elements are selected at both importer and timetable list
                 */
                var _observeInsertButton =  function(){
                    if(query.dom.value != '' && query.dom.value != '[]')
                        self.insertButton.disabledButtonWithTooltip('enable');
                    else
                        self.insertButton.disabledButtonWithTooltip('disable');

                };
                this.importerList = new ImporterIctpList([],
                        {"height" : this.height - 80, "width" : this.width - 20, "cssFloat" : "left"},
                        'entryList', 'entryListSelected', true, _observeInsertButton);

                        
                        
                var upload = function() {
                    var uploadAction = 'upload';  
                    var popup = new UploadXlsFileDialog( 'Upload XLS',
                        {conference: self.confId}, '350px', '30px',
                        '', // ${ jsonEncode(Template.formats) }
                        uploadAction, //'${ urlHandlers.UHSetTemplate.getURL(ConfReview.getConference()) }',
                        //self._updateImported
                        search,
                        query                        
                    );
                    return popup.open();
                };
                var fileButton = Html.input('button',{}, $T('upload')); 
                fileButton.observeClick(upload);                        
                        
                        
                return Html.div({},
                        Html.div({className:'importDialogHeader', style:{width:pixels(this.width * 0.9)}}, fileButton, query, searchButton),
                        this.emptySearchDiv.draw(),  this.importerList.draw());
            },
            _getButtons: function() {
                var self = this;
                return [
                    [$T('Proceed...'), function() {
                        
                        var entries = self.query;
                        var importer = self.importerList.getLastImporter();
                        new ImporterIctpDurationDialog(entries, self.confId, self.timetable, importer, function(redirect) {
                            if(!redirect) {
                                self._hideLists();

                                self.importerList.clearSelection();
                                self.emptySearchDiv.showAfterSearch();
                            } else {
                                self.close();
                            }
                        });
                    }],
                    [$T('Close'), function() {
                        self.close();
                    }]
                ];
            },
            draw: function(){
                this.insertButton = this.buttons.eq(0);
                this.insertButton.disabledButtonWithTooltip({
                    tooltip: $T('Please select contributions to be added and their destination.'),
                    disabled: true
                });
                return this.ExclusivePopupWithButtons.prototype.draw.call(this, this.drawContent());
            }
        },
        /**
         * Importer's main tab. Contains inputs for typing a query and select the importer type.
         * After making a query imported entries are displayed at the left side of the dialog, while
         * at the right side list of all entries in the event's timetable will be shown. User can add
         * new contributions to the timetable's entry by simply selecting them and clicking at 'proceed'
         * button.
         * @param timetable Indico timetable object. If it's undefined constructor will try to fetch
         * window.timetable object.
         */
        function(timetable){
            var self = this;
            this.ExclusivePopupWithButtons($T("Import Entries"));
            this.timetable = timetable?timetable:window.timetable;
            this.topTimetable = this.timetable.parentTimetable?this.timetable.parentTimetable:this.timetable
            this.confId = this.topTimetable.contextInfo.id;
            this.height = document.body.clientHeight - 200;
            this.width = document.body.clientWidth - 200;
            this.query = '';
            this.importers;
            this.PreLoadHandler(
                    this._preload,
                    function() {
                        self.open();
                    });
            this.execute();
        }
);

type("PresearchContainer",[],
        {
            /**
             * Shows a widget.
             */
            show: function(){
                this.contentDiv.dom.style.display = 'block';
            },
            /**
             * Hides a widget.
             */
            hide: function(){
                this.contentDiv.dom.style.display = 'none';
            },
            /**
             * Changes a content of the widget. It should be used after making a first successful import.
             */
            showAfterSearch: function(){
                this.firstSearch.dom.style.display = 'none';
                this.afterSearch.dom.style.display = 'inline';
            },
            draw: function(){
                this.firstSearch = Html.span({style:{display:"inline"}},$T("Please upload your XLS file and press 'search'."));
                var hereLink = Html.span({className: 'fakeLink'}, $T("here"));
                hereLink.observeClick(this.afterSearchAction);
                this.afterSearch = Html.span({style:{display:"none"}},$T("Your entries were inserted "), Html.span({style:{fontWeight:'bold'}}, $T("successfully")), $T(". Please specify a new query or click "), hereLink, $T(" to see the previous results."));
                this.contentDiv = Html.div({className:'presearchContainer', style:{"height" : pixels(this.height - 130)}}, this.firstSearch, this.afterSearch);
                return this.contentDiv;
            }
        },
        /**
         * A placeholder for importer and timetable list widgets. Contains user's tips about what to do right now.
         * @param widget's height
         * @param function executed afer clicking 'here' link.
         */
        function(height, afterSearchAction){
            this.height = height;
            this.afterSearchAction = afterSearchAction;
        });

type("ImporterIctpDurationDialog",["ExclusivePopupWithButtons", "PreLoadHandler"],
        {
            _preload: [
                    /**
                     * Fetches the default start time of the first inserted contribution.
                     * Different requests are used for days, sessions and contributions.
                     */
                    function(hook){
                        var self = this;
                        var killProgress = IndicoUI.Dialogs.Util.progress($T('Importing...'));
                        indicoRequest("importer.saveData", {'confId' : this.confId,
                                                   'data' : this.entries},
                                                   function(result, error){
                                                       //alert("RES="+result+"___ERR="+error);
                                                       hook.set(true);
                                                       killProgress();
                                                   });
                        
                    }
            ],

            drawContent: function(){
                    return
            },



            draw: function(){
                window.location.reload(true);
                return
            }
        },
        /**
         * Dialog used to set the duration of the each contribution and the start time of the first on.
         * @param entries List of imported entries
         * @param confIf Id of the current conference
         * @param timetable Indico timetable object of the current conference.
         * @param importer Name of the used importer.
         * @param successFunction Function executed after inserting events.
         */
        function(entries, confId, timetable, importer, successFunction){
            var self = this;
            //this.ExclusivePopupWithButtons($T('Adjust entries'));
            this.confId = confId;
            this.entries = entries;
            this.timetable = timetable;
            this.successFunction = successFunction;
            this.importer = importer;
            this.parameterManager = new IndicoUtil.parameterManager();
            this.info = new WatchObject();
            this.PreLoadHandler(
                    this._preload,
                    function() {
                        self.open();
                    });
            this.execute();
        }
);

type("ImporterIctpListWidget", ["SelectableListWidget"],
        {
            /**
             * Removes all entries from the list
             */
            clearList: function(){
                this.SelectableListWidget.prototype.clearList.call(this);
                this.recordDivs = [];
            },
            /**
             * Returns number of entries in the list.
             */
            getLength: function(){
                return this.recordDivs.length;
            },
            getLastQuery: function(){
                return this.lastSearchQuery;
            },
            /**
             * Returns the name of the last used importer.
             */
            getLastImporter: function(){
                return this.lastSearchImporter;
            },
                                    
            _convDate : function(d) {
                dd = str(d);
                ds = dd.split(",")
                return ds[0]+"/"+ds[1]+"/"+ds[2]            
            },
            _convTime : function(d) {
                dd = str(d);
                ds = dd.split(",")
                return ds[3]+":"+ds[4]     
            },            
            /**
             * Base search method. Sends a query to the importer.
             * @param query A query string send to the importer
             * @param importer A name of the used importer.
             * @param size Number of fetched objects.
             * @param successFunction Method executed after successful request.
             * @param callbacks List of methods executed after request (doesn't matter if successful).
             */
            _searchBase: function(query, importer, size, successFunc, callbacks) {
                var self = this;
                var killProgress = IndicoUI.Dialogs.Util.progress();
                indicoRequest("importer.import",
                        {'importer': importer,
                         'query': query,
                         // One more entry is fetched to be able to check if it's possible to fetch
                         // more entries in case of further requests.
                         'size': size + 1},
                         function(result, error) {
                             if(!error && result && successFunc)
                                 successFunc(result);
                             each(callbacks, function(callback){
                                 callback();
                             });
                             killProgress();
                         });
                //Saves last request data
                this.lastSearchImporter = importer;
                this.lastSearchQuery = query;
                this.lastSearchSize = size;
            },
            /**
             * Clears the list and inserts new imported entries.
             * @param query A query string send to the importer
             * @param importer A name of the used importer.
             * @param size Number of fetched objects.
             * @param callbacks List of methods executed after request (doesn't matter if successful).
             */
            search: function(query, importer, size, callbacks){
                var self = this;
                var successFunc = function(result){
                    self.clearList();
                    var importedRecords = 0;
                    for( record in result ){
                        //checks if it's possible to import more entries
                        //if(size == importedRecords++){
                        //    self.moreToImport = true;
                        //    break;
                        //}
                        self.set(record, $O(result[record]));
                    }
                }
                this._searchBase(query, importer, size, successFunc, callbacks);
            },

            /**
             * Draws sequence number attached to the item div
             */
            _drawSelectionIndex: function(){
                var self = this;
                var selectionIndex = Html.div({className:'entryListIndex', style:{display:'none', cssFloat:'left'}});

                return selectionIndex;
            },

            _drawItem : function(record) {
                var self = this;
                var recordDiv = Html.div({})
                var key = record.key;
                var record = record.get();
                // Empty fields are not displayed.
                if ( record.get("reportNumbers") ){
                    var reportNumber = Html.div({}, Html.em({},$T("Report number(s)")), ":");
                    each(record.get("reportNumbers"), function(id){
                        reportNumber.append(" " + id);
                    });
                    recordDiv.append(reportNumber);
                }
                
                
                if ( record.get("startDate") )
                    recordDiv.append(Html.div({}, Html.em({},$T("Start Date")), ": ", this._convDate(record.get("startDate"))));
                if ( record.get("eventType") )
                    recordDiv.append(Html.div({}, Html.em({},$T("Event Type")), ": ", record.get("eventType")));
                if ( record.get("title") )
                    recordDiv.append(Html.div({}, Html.em({},$T("Title")), ": ", record.get("title")));
                if ( record.get("startTime") )
                    recordDiv.append(Html.div({}, Html.em({},$T("Start Time")), ": ", this._convTime(record.get("startTime"))));
                if ( record.get("duration") )
                    recordDiv.append(Html.div({}, Html.em({},$T("Duration")), ": ", this._convTime(record.get("duration"))));
                if ( record.get("speaker") )
                    recordDiv.append(Html.div({}, Html.em({},$T("Speaker")), ": ", record.get("speaker")));
                if ( record.get("affiliation") )
                    recordDiv.append(Html.div({}, Html.em({},$T("Affiliation")), ": ", record.get("affiliation")));
                if ( record.get("room") )
                    recordDiv.append(Html.div({}, Html.em({},$T("Room")), ": ", record.get("room")));
                if ( record.get("comment") )
                    recordDiv.append(Html.div({}, Html.em({},$T("Comment")), ": ", record.get("comment")));
                    
                recordDiv.append(this._drawSelectionIndex());
                this.recordDivs[key] = recordDiv;
                return recordDiv;
            },
            /**
             * Observer function executed when selection is made. Draws a number next to the item div, which
             * represents insertion sequence of entries.
             */
            observeSelection: function(list){
                var self = this;
                //Clears numbers next to the all divs
                for( entry in this.recordDivs){
                    var record = this.recordDivs[entry];
                    record.dom.lastChild.style.display = 'none';
                    record.dom.lastChild.innerHTML = '';
                }
                var seq = 1;
                var self = this;
                
            }
        },
        
        /**
         * Widget containing a list of imported contributions. Supports multiple selections of results and
         * keeps selection order.
         * @param events List of events to be inserted during initialization.
         * @param listStyle Css class name of the list.
         * @param selectedStyle Css class name of a selected element.
         * @param customObserver Function executed while selection is made.
         */
        function(events, listStyle, selectedStyle, customObserver){
            var self = this;
            // After selecting/deselecting an element two observers are executed.
            // The first is a default one, used to keep selected elements order.
            // The second one is a custom observer passed in the arguments list.
            var observer = function(list) {
                this.observeSelection(list);
                if(customObserver)
                    customObserver(list);
            }
            this.SelectableListWidget(observer, false, listStyle, selectedStyle);
            //this.selectedList = new QueueDict();
            this.recordDivs = {};
            for( record in events )
                this.set(record, $O(events[record]));
        });
        
        
type("ImporterIctpList", [],
        {
            /**
             * Show the widget.
             */
            show: function(){
                this.contentDiv.dom.style.display = 'block';
            },
            /**
             * Hides the widget.
             */
            hide: function(){
                this.contentDiv.dom.style.display = 'none';
            },
            /**
             * Returns list of the selected entries.
             */
            getSelectedList: function(){
                return this.importerWidget.getSelectedList();
            },
            
            /**
             * Removes all entries from the selection list.
             */
            clearSelection: function(){
                this.importerWidget.clearSelection();
            },
            /**
             * Returns last used importer.
             */
            getLastImporter: function(){
                return this.importerWidget.getLastImporter();
            },
            /**
             * Changes widget's header depending on the number of results in the list.
             */
            handleContent: function(){
                if( this.descriptionDiv && this.emptyDescriptionDiv) {
                    if( this.importerWidget.getLength() == 0) {
                        this.descriptionDiv.dom.style.display = 'none';
                        this.emptyDescriptionDiv.dom.style.display = 'block';
                        this.moreEntriesDiv.dom.style.display = 'none';
                    } else {
                        this.entriesCount.dom.innerHTML = this.importerWidget.getLength() == 1?
                                $T("1 entry was found. "):this.importerWidget.getLength() + $T(" entries were found. ");
                        this.descriptionDiv.dom.style.display = 'block';
                        this.emptyDescriptionDiv.dom.style.display = 'none';
                        this.moreEntriesDiv.dom.style.display = 'none';
                        this.observer()
                    }
                }
            },
            /**
             * Adds handleContent method to the callback list. If callback list is empty, creates a new one
             * containing only handleContent method.
             * @return list with inserted handleContent method.
             */
            _appendCallbacks: function(callbacks){
                var self = this;
                if( callbacks )
                    callbacks.push(function(){self.handleContent()});
                else
                    callbacks = [function(){self.handleContent()}];
                return callbacks;
            },
            /**
             * Calls search method from ImporterListWidget object.
             */
            search: function(query, importer, size, callbacks){
                this.importerWidget.search(query, importer, size, this._appendCallbacks(callbacks));
            },
            /**
             * Calls append method from ImporterListWidget object.
             */
            append: function(size, callbacks){
                this.importerWidget.append(size, this._appendCallbacks(callbacks));
            },
            draw: function(){
                var importerDiv = this._drawImporterDiv();
                this.contentDiv = Html.div({className:'entryListContainer'}, this._drawHeader(), importerDiv);
                for ( style in this.style ){
                    this.contentDiv.setStyle(style, this.style[style]);
                    if(style == 'height')
                        importerDiv.setStyle('height', this.style[style] - 76); //76 = height of the header
                }
                if( this.hidden )
                    this.contentDiv.dom.style.display = 'none';
                return this.contentDiv;
            },
            _drawHeader: function(){
                this.entriesCount = Html.span({},'0');
                this.descriptionDiv = Html.div({className:'entryListDesctiption'},this.entriesCount);
                this.emptyDescriptionDiv = Html.div({className:'entryListDesctiption'},$T("No result were found. Please change the search phrase."));
                return Html.div({}, Html.div({className:'entryListHeader'}, $T("Search results:")), this.descriptionDiv, this.emptyDescriptionDiv);
            },
            _drawImporterDiv: function(){
                var self = this;
                this.moreEntriesDiv = Html.div({className:'fakeLink', style:{paddingBottom:pixels(15), textAlign:'center', clear: 'both', marginTop: pixels(15)}},$T("more results"));
                this.moreEntriesDiv.observeClick(function(){
                    self.append(20);
                });
                return Html.div({style:{overflow:'auto'}}, this.importerWidget.draw(), this.moreEntriesDiv);
            }
        },
        /**
         * Encapsulates ImporterListWidget. Adds a header depending on the number of entries in the least.
         * Adds a button to fetch more entries from selected importer.
         * @param events List of events to be inserted during initialization.
         * @param style Dictionary of css styles applied to the div containing the list. IMPORTANT pass 'height'
         * attribute as an integer not a string, because some further calculations will be made.
         * @param listStyle Css class name of the list.
         * @param selectedStyle Css class name of a selected element.
         * @param hidden If true widget will not be displayed after being initialized.
         * @param observer Function executed while selection is made.
         */
        function( events, style, listStyle, selectedStyle, hidden, observer ){
            this.observer = observer;
            this.importerWidget = new ImporterIctpListWidget(events, listStyle, selectedStyle, observer);
            this.style = style;
            this.hidden = hidden;
        });

