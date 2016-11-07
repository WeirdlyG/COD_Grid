Ext.define('CustomApp', {
  extend: 'Rally.app.App',
  componentCls: 'app',

  // App level references for easy access in various methods
  feature_rallywsapidatastore: undefined,
  feature_rallygridboard: undefined,

// =============================================================================
  // Entry Point to App
  launch: function() {
      console.log('COD Grid!')
      this._loadFeatureDataStore();
  },
// =============================================================================

// =============================================================================
  // Get data from CAAC
  _loadFeatureDataStore: function() {
    var me = this;

    // If feature store exists, just load new data
    if (me.feature_rallywsapidatastore) {
      console.log('Store exists');
      // Reload data in store
      me.feature_rallywsapidatastore.load();

    // Else create feature store
    } else {
      console.log('Creating store');
      // Crete new data store
      me.feature_rallywsapidatastore = Ext.create('Rally.data.wsapi.Store', { // https://help.rallydev.com/apps/2.1/doc/#!/api/Rally.data.wsapi.Store
        model: 'PortfolioItem/Feature',
        autoLoad: true,
        listeners: {
            load: function(myStore, myRecords, success) {  // https://help.rallydev.com/apps/2.1/doc/#!/api/Rally.data.wsapi.Store-event-load
                console.log('got data!', myStore, myRecords);
                if (!me.feature_rallygridboard) { // Only create a grid if it doesn't already exist
                  me._createFeatureGrid(myStore);
                }
            },
            scope: me // This tells the wsapi data store to forward pass along the app-level context into ALL listener functions
        },
        fetch: ['FormattedID', 'Name', 'TimeCriticality', 'RROEValue', 'UserBusinessValue', 'ValueScore']
      });
    }
  },
// =============================================================================

// =============================================================================
  // Create and show a grid of given features
  _createFeatureGrid: function(myFeatureStore) {
    var me = this;
    me.feature_rallygridboard = Ext.create('Rally.ui.grid.Grid', {  // https://help.rallydev.com/apps/2.1/doc/#!/api/Rally.ui.grid.Grid
      store: myFeatureStore,
      columnCfgs: [ // Columns to be displayed; must be the same names provided by the store
        'FormattedID', 'Name', 'TimeCriticality', 'RROEValue', 'UserBusinessValue', 'ValueScore'
      ]
    });
    me.add(me.feature_rallygridboard);       // add the grid Component to the app-level Container (by doing this.add, it uses the app container)
  }
// =============================================================================


});
