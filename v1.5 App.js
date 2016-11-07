var Ext = window.Ext4 || window.Ext;
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        var that = this;

        this._grid = null;

        this._getTreeStore();
    },

    // Get Feature data for the gridboard
    _getTreeStore: function() {

        var model = 'PortfolioItem/Feature';

        if (this._grid !== null) {
            this._grid.destroy();
        }

        // Constructs Rally.data.wsapi.TreeStore instances to be used in conjunction with a Rally.ui.grid.TreeGrid.
        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({ // https://help.rallydev.com/apps/2.1/doc/#!/api/Rally.data.wsapi.TreeStoreBuilder
            models: [ model ],
            listeners: {
                load: function(store) {
                    var records = store.getRootNode().childNodes;
                    this._calculateScore(records);
                },
                update: function(store, rec, modified, opts) {
                    this._calculateScore([rec]);
                },
                scope: this
            },
           // autoLoad: true,
            enableHierarchy: true
        }).then({
            success: this._addRallygridBoard,
            scope: this
        });
    },

    _addRallygridBoard: function(store, records) {
        var modelNames = 'PortfolioItem/Feature';
        var context = this.getContext();

        // A wrapper component that displays a grid and/or a board. This component is enhanced via plugins to add functionality like add new, field/column selection, filtering and toggling between grid and board views.
        this._grid = this.add({
            xtype: 'rallygridboard',  // https://help.rallydev.com/apps/2.1/doc/#!/api/Rally.ui.gridboard.GridBoard
            context: context,
            modelNames: [ modelNames ],
            toggleState: 'grid',
            stateful: false,
            plugins: [
                {
                    ptype: 'rallygridboardcustomfiltercontrol',
                    filterChildren: false,
                    filterControlConfig: {
                        modelNames: [ modelNames ],
                        stateful: true,
                        stateId: context.getScopedStateId('custom-filter-example')
                    }
                },
                {
                    ptype: 'rallygridboardfieldpicker',
                    headerPosition: 'left',
                    modelNames: [ modelNames ],
                    stateful: true,
                    stateId: context.getScopedStateId('columns-example')
                },
                {
                    ptype: 'rallygridboardactionsmenu',
                    menuItems: [
                        {
                            text: 'Export...',
                            handler: function() {
                                window.location = Rally.ui.grid.GridCsvExport.buildCsvExportUrl(
                                    this.down('rallygridboard').getGridOrBoard());
                            },
                            scope: this
                        }
                    ],
                    buttonConfig: {
                        iconCls: 'icon-export'
                    }
                }
            ],
            gridConfig: {
                store: store,
                columnCfgs: [
                    'Name', 'TimeCriticality', 'RROEValue', 'UserBusinessValue', 'ValueScore',
                ]
            },
            height: this.getHeight()
        });
    },

    // Calculate Value Score (COD) and populate Value Score field
    _calculateScore: function(records)  {
        var that = this;

        // Calculate COD (Value Score)
        Ext.Array.each(records, function(feature) {
            var timeValue = feature.data['TimeCriticality'];
            var OERR      = feature.data['RROEValue'];
            var userValue = feature.data['UserBusinessValue'];
            var oldValueScore = feature.data['ValueScore'];
            var newValueScore
            newValueScore = userValue + timeValue + OERR;
            if (oldValueScore !== newValueScore) { // only update if Value Score changed
                feature.set('ValueScore', newValueScore); // set Value Score value in db
            }
        });
    },

});
