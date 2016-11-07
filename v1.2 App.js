var Ext = window.Ext4 || window.Ext;
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        var that = this;

        // console.log(that.getSettings());
        that.TimeCriticalityField = that.getSetting('TimeCriticalityField');
        that.RROEValueField = that.getSetting('RROEValueField');
        that.UserBusinessValueField = that.getSetting('UserBusinessValueField');
        that.WSJFScoreField = that.getSetting('WSJFScoreField');
        that.JobSizeField = that.getSetting('JobSizeField');
        that.ValueScoreField = that.getSetting('ValueScoreField');
        that.ShowValuesAfterDecimal = that.getSettingsFields('ShowValuesAfterDecimal');

        this._grid = null;
        this._piCombobox = this.add({
            xtype: "rallyportfolioitemtypecombobox",
            padding: 5,
            listeners: {
                //ready: this._onPICombobox,
                select: this._onPICombobox,
                scope: this
            }
        });
    },

    _onPICombobox: function() {
        var selectedType = this._piCombobox.getRecord();
        var model = selectedType.get('TypePath');

        if (this._grid !== null) {
            this._grid.destroy();
        }

        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
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
            success: this._onStoreBuilt,
            scope: this
        });
    },

    _onStoreBuilt: function(store, records) {
        //var records = store.getRootNode().childNodes;

        var selectedType = this._piCombobox.getRecord();
        var modelNames = selectedType.get('TypePath');

        var context = this.getContext();
        this._grid = this.add({
            xtype: 'rallygridboard',
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
                    'Name',
                    'TimeCriticality', 'RROEValue', 'UserBusinessValue', 'JobSize', 'ValueScore',
                    this.getSetting("useExecutiveMandateField")===true ? this.getSetting("ExecutiveMandateField") : null,
                    {
                        text: "WSJF Score",
                        dataIndex: "WSJFScore",
                        editor: null
                    }
                ]
            },
            height: this.getHeight()
        });
    },

    _calculateScore: function(records)  {
        var that = this;

        Ext.Array.each(records, function(feature) {
            var jobSize = feature.data.JobSize;
            var execMandate = that.getSetting("useExecutiveMandateField")===true ? feature.data[that.getSetting("ExecutiveMandateField")] : 1;
            execMandate = _.isUndefined(execMandate) || _.isNull(execMandate) || execMandate === 0 ? 1 : execMandate;

            var timeValue = feature.data[that.TimeCriticalityField];
            var OERR      = feature.data[that.RROEValueField];
            var userValue = feature.data[that.UserBusinessValueField];
            var oldWSJFScore  = feature.data[that.WSJFScoreField];
            var oldValueScore = feature.data[that.ValueScoreField];
            var isChecked = that.getSetting("ShowValuesAfterDecimal");

            if (jobSize > 0) { // jobSize is the denominator so make sure it's not 0
                var newWSJFScore;

                if( !isChecked ) {
                    newWSJFScore = ( ((userValue + timeValue + OERR ) * execMandate) / jobSize);
                    newWSJFScore = Math.round(newWSJFScore);
                }
                else {
                    newWSJFScore = Math.floor(((userValue + timeValue + OERR ) * execMandate / jobSize) * 100)/100;
                }

                if (oldWSJFScore !== newWSJFScore) { // only update if score changed
                    feature.set('WSJFScore', newWSJFScore); // set score value in db
                }
            }

            // Calculate COD (Value Score)
            var newValueScore
            newValueScore = userValue + timeValue + OERR;
            if (oldValueScore !== newValueScore) { // only update if Value Score changed
                feature.set('ValueScore', newValueScore); // set Value Score value in db
            }

        });
    },

    getSettingsFields: function() {
        var values = [
            {
                name: 'ShowValuesAfterDecimal',
                xtype: 'rallycheckboxfield',
                label : "Show Values After the Decimal",
                labelWidth: 200
            },
            {
                name: 'useExecutiveMandateField',
                xtype: 'rallycheckboxfield',
                label : "Use Custom Executive Mandate Field",
                labelWidth: 200
            },
            {
                name: 'ExecutiveMandateField',
                xtype: 'rallytextfield',
                label : "Executive Mandate Field",
                labelWidth: 200
            },
            {
                name: 'TimeCriticalityField',
                xtype: 'rallytextfield',
                label : "Time Criticality Field",
                labelWidth: 200
            },
            {
                name: 'RROEValueField',
                xtype: 'rallytextfield',
                label : "RROEValue Field",
                labelWidth: 200
            },
            {
                name: 'UserBusinessValueField',
                xtype: 'rallytextfield',
                label : "User Business Value Field",
                labelWidth: 200
            },
            {
                name: 'WSJFScoreField',
                xtype: 'rallytextfield',
                label : "WSJFScore Field",
                labelWidth: 200
            },
            {
                name: 'JobSizeField',
                xtype: 'rallytextfield',
                label : "Job Size Field",
                labelWidth: 200
            },
            {
                name: 'ValueScoreField',
                xtype: 'rallytextfield',
                label : "Value Score Field",
                labelWidth: 200
            }
        ];

        return values;
    },

    config: {
        defaultSettings : {
            ShowValuesAfterDecimal: false,
            useExecutiveMandateField : false,
            ExecutiveMandateField : 'c_ExecutiveMandate',
            TimeCriticalityField : 'TimeCriticality',
            RROEValueField : 'RROEValue',
            UserBusinessValueField : 'UserBusinessValue',
            WSJFScoreField : 'WSJFScore',
            JobSizeField : 'JobSize',
            ValueScoreField: 'ValueScore'
        }
    }
});
