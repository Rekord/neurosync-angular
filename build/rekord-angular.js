(function (app, global, ng, Rekord, undefined)
{

  var Resolve = {};
  var Factory = {};

  ng.isArray = function(a)
  {
    return a instanceof Array;
  };


function InitializeRekord($http)
{
  Rekord.setRest(function(database)
  {
    function removeTrailingSlash(x)
    {
      return x.charAt(x.length - 1) === '/' ? x.substring(0, x.length - 1) : x;
    }

    function execute( method, data, url, success, failure, offlineValue )
    {
      Rekord.debug( Rekord.Debugs.REST, this, method, url, data );

      if ( Rekord.forceOffline )
      {
        failure( offlineValue, 0 );
      }
      else
      {
        function onRestSuccess(response)
        {
          success( response.data );
        }

        function onRestError(response)
        {
          failure( response.data, response.status );
        }

        var options =
        {
          method: method,
          data: data,
          url: url
        };

        $http( options ).then( onRestSuccess, onRestError );
      }
    }

    return {
      all: function( success, failure )
      {
        execute( 'GET', undefined, database.api, success, failure, [] );
      },
      get: function( model, success, failure )
      {
        execute( 'GET', undefined, removeTrailingSlash( database.api + model.$key() ), success, failure );
      },
      create: function( model, encoded, success, failure )
      {
        execute( 'POST', encoded, removeTrailingSlash( database.api ), success, failure, {} );
      },
      update: function( model, encoded, success, failure )
      {
        execute( 'PUT', encoded, removeTrailingSlash( database.api + model.$key() ), success, failure, {} );
      },
      remove: function( model, success, failure )
      {
        execute( 'DELETE', undefined, removeTrailingSlash( database.api + model.$key() ), success, failure, {} );
      },
      query: function( url, query, success, failure )
      {
        var method = query ? 'POST' : 'GET';

        execute( method, query, url, success, failure );
      }
    };
  });

  Rekord.listenToNetworkStatus();
}

function Bind( scope, target, callback )
{
  if ( !(this instanceof Bind) ) return new Bind( scope, target, callback );

  this.scope = scope;
  this.target = target;
  this.callback = callback;

  this.on();
}

Bind.prototype =
{
  on: function()
  {
    var target = this.target;

    if ( Rekord.isRekord( target ) )
    {
      target = this.target = target.Database;
    }

    this.off = target[ target.$change ? '$change' : 'change' ]( this.notify, this );

    this.scope.$on( '$destroy', this.off );
  },
  notify: function()
  {
    var scope = this.scope;

    if( !scope.$$phase )
    {
      scope.$digest();

      if ( this.callback )
      {
        this.callback.apply( this.target );
      }

      Rekord.debug( Rekord.Debugs.ScopeDigest, this, scope );
    }
  }
};


function Select(source, select, fill)
{
  this.$onRemove  = Rekord.bind( this, this.$handleRemove );
  this.$onRemoves = Rekord.bind( this, this.$handleRemoves );
  this.$onCleared = Rekord.bind( this, this.$handleCleared );
  this.$onReset   = Rekord.bind( this, this.$handleReset );

  this.$reset( source );
  this.$select( select, fill );
}

Select.prototype =
{

  $reset: function(source)
  {
    if ( this.$source !== source )
    {
      if ( this.$source )
      {
        this.$disconnect();
      }

      this.$source = source;
      this.$connect();
    }
  },

  $connect: function()
  {
    this.$source.on( Rekord.Collection.Events.Remove, this.$onRemove );
    this.$source.on( Rekord.Collection.Events.Removes, this.$onRemoves );
    this.$source.on( Rekord.Collection.Events.Cleared, this.$onCleared );
    this.$source.on( Rekord.Collection.Events.Reset, this.$onReset );
  },

  $disconnect: function()
  {
    this.$source.off( Rekord.Collection.Events.Remove, this.$onRemove );
    this.$source.off( Rekord.Collection.Events.Removes, this.$onRemoves );
    this.$source.off( Rekord.Collection.Events.Cleared, this.$onCleared );
    this.$source.off( Rekord.Collection.Events.Reset, this.$onReset );
  },

  $select: function(select, fill)
  {
    if ( Rekord.isArray( select ) )
    {
      var db = this.$source.database;
      var remove = {};

      for (var key in this)
      {
        if ( Rekord.isBoolean( this[ key ] ) )
        {
          remove[ key ] = this[ key ];
        }
      }

      for (var i = 0; i < select.length; i++)
      {
        var key = db.buildKeyFromInput( select[ i ] );

        this[ key ] = true;

        delete remove[ key ];
      }

      for (var key in remove)
      {
        delete this[ key ];
      }

      if ( fill )
      {
        var keys = this.$source.keys();

        for (var i = 0; i < keys.length; i++)
        {
          var key = keys[ i ];

          if ( !this[ key ] )
          {
            this[ key ] = false;
          }
        }
      }

    }
  },

  $selection: function(out)
  {
    var source = this.$source;
    var selection = out || [];

    for (var key in this)
    {
      if ( this[ key ] === true )
      {
        var model = source.get( key );

        if ( model )
        {
          selection.push( model );
        }
      }
    }

    return selection;
  },

  $handleRemove: function(removed)
  {
    var db = this.$source.database;
    var key = db.buildKeyFromInput( removed );

    delete this[ key ];
  },

  $handleRemoves: function(removed)
  {
    for (var i = 0; i < removed.length; i++)
    {
      this.$handleRemove( removed[i] );
    }
  },

  $handleCleared: function()
  {
    for (var key in this)
    {
      if ( Rekord.isBoolean( this[ key ] ) )
      {
        delete this[ key ];
      }
    }
  },

  $handleReset: function()
  {
    var source = this.$source;

    for (var key in this)
    {
      if ( Rekord.isBoolean( this[ key ] ) )
      {
        if ( !source.has( key ) )
        {
          delete this[ key ];
        }
      }
    }
  }
};

Rekord.ModelCollection.prototype.selectable = function(select, fill)
{
  return new Select( this, select, fill );
};


function hasModule(moduleName)
{
  if ( moduleName in hasModule.tested )
  {
    return hasModule.tested[ moduleName ];
  }

  try
  {
    angular.module( moduleName );

    return hasModule.tested[ moduleName ] = true;
  }
  catch (e)
  {
    return hasModule.tested[ moduleName ] = false;
  }
}

hasModule.tested = {};

function getRouteParameter()
{
  return getRouteParameter.cached ? getRouteParameter.cached : getRouteParameter.cached =
    ( hasModule( 'ui.router' ) ? '$stateParams' :
      ( hasModule( 'ngRoute' ) ? '$route' :
        false ) );
}

function buildParamResolver()
{
  if ( hasModule( 'ui.router') )
  {
    return function($stateParams)
    {
      return $stateParams;
    };
  }
  else if ( hasModule( 'ngRoute') )
  {
    return function($route)
    {
      return $route.current;
    };
  }
  return function()
  {
    return false;
  };
}

function buildTemplateResolver(routeParams)
{
  return function(text)
  {
    if ( Rekord.isString( text ) && routeParams )
    {
      return Rekord.format( text, routeParams );
    }

    return text;
  };
}

getRouteParameter.cached = null;

Resolve.factory = function( name, callback )
{
  var param = getRouteParameter();
  var paramResolver = buildParamResolver();
  var cache = false;
  var cachedValue = void 0;

  function factory($q, routing)
  {
    var defer = $q.defer();

    if ( cachedValue !== void 0 )
    {
      defer.resolve( cachedValue );
    }
    else
    {
      var routeParams = paramResolver( routing );
      var templateResolver = buildTemplateResolver( routeParams );

      if ( cache )
      {
        defer.promise.then(function(resolvedValue)
        {
          cachedValue = resolvedValue;
        });
      }

      Rekord.get( name, function(model)
      {
        callback( model, defer, templateResolver );
      });
    }

    return defer.promise;
  }

  factory.$inject = ['$q'];

  if ( param )
  {
    factory.$inject.push( param );
  }

  factory.cache = function()
  {
    cache = true;

    return factory;
  };

  factory.inject = function()
  {
    for (var i = 0; i < arguments.length; i++)
    {
      var arg = arguments[ i ];

      if ( Rekord.isArray( arg ) )
      {
        factory.$inject.push.apply( factory.$inject, arg );
      }
      else
      {
        factory.$inject.push( arg );
      }
    }

    return factory;
  };

  return factory;
};

function ResolveInput(obj, resolver)
{
  if ( Rekord.isObject( obj ) )
  {
    var resolved = {};

    for (var prop in obj)
    {
      resolved[ prop ] = resolver( obj[ prop ] );
    }

    return resolved;
  }

  return resolver( obj );
}

Resolve.model = function( name, input )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedInput = ResolveInput( input, templateResolver );

    model.Database.grabModel( resolvedInput, function(instance)
    {
      if ( instance )
      {
        defer.resolve( instance );
      }
      else
      {
        defer.reject();
      }
    });
  });
};

Resolve.fetch = function( name, input )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedInput = ResolveInput( input, templateResolver );

    model.fetch( resolvedInput, function(instance)
    {
      defer.resolve( instance );
    });
  });
};

Resolve.fetchAll = function( name )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    model.fetchAll(function(models)
    {
      defer.resolve( models );
    });
  });
};

Resolve.grab = function( name, input )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedInput = ResolveInput( input, templateResolver );

    model.grab( resolvedInput, function(instance)
    {
      defer.resolve( instance );
    });
  });
};

Resolve.grabAll = function( name )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    model.grabAll(function(models)
    {
      defer.resolve( models );
    });
  });
};

Resolve.create = function( name, properties, dontSave )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedProperties = ResolveInput( properties, templateResolver );

    if ( dontSave )
    {
      defer.resolve( new model( resolvedProperties ) );
    }
    else
    {
      var instance = model.create( resolvedProperties );

      if ( instance.$isSaved() )
      {
        defer.resolve( instance );
      }
      else
      {
        instance.$once( Rekord.Model.Events.RemoteSaves, function()
        {
          defer.resolve( instance );
        });
      }
    }
  });
};

Resolve.search = function( name, query, props )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedQuery = ResolveInput( query, templateResolver );
    var remoteQuery = model.search( resolvedQuery );

    if ( Rekord.isObject( props ) )
    {
      Rekord.transfer( props, remoteQuery );
    }

    remoteQuery.$run();

    remoteQuery.$success(function()
    {
      defer.resolve( remoteQuery );
    });

    remoteQuery.$failure(function()
    {
      defer.reject();
    });
  });
};

Resolve.all = function( name )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    model.Database.ready(function()
    {
      defer.resolve( model.all() );
    });
  });
};

Resolve.where = function( name, whereProperties, whereValue, whereEquals )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedWhereProperties = ResolveInput( whereProperties, templateResolver );
    var resolvedWhereValue = ResolveInput( whereValue, templateResolver );

    model.Database.ready(function()
    {
      defer.resolve( model.all().filtered( resolvedWhereProperties, resolvedWhereValue, whereEquals ) );
    });
  });
};

Factory.helper = function(name, impl)
{
  var ref = null;

  Rekord.get( name, function(rekord)
  {
    ref = rekord;
  });

  return function FactoryImplementation()
  {
    if ( !ref )
    {
      throw name + ' Rekord failed to load or does not exist.';
    }

    return impl( ref );
  };
};

Factory.search = function(name, url, props, run, paged)
{
  return Factory.helper( name, function(model)
  {
    var search = paged ? model.searchPaged( url ) : model.search( url );

    if ( Rekord.isObject( props ) )
    {
      Rekord.transfer( props, search );
    }

    if ( run )
    {
      search.$run();
    }

    return search;
  });
};

Factory.lazyLoad = function(name, callback, context)
{
  var initialized = {};

  return Factory.helper( name, function(model)
  {
    if ( !model.Database.remoteLoaded && !(name in initialized) )
    {
      initialized[ name ] = true;

      model.Database.refresh( callback, context );
    }

    return model;
  });
};

Factory.filtered = function(name, where, value, equals)
{
  return Factory.helper( name, function(model)
  {
    return model.filtered( where, value, equals );
  });
};

Factory.all = function(name)
{
  return Factory.helper( name, function(model)
  {
    return model.all();
  });
};

Factory.create = function(name, props)
{
  return Factory.helper( name, function(model)
  {
    return model.create( props );
  });
};

Factory.fetchAll = function(name, callback, context)
{
  return Factory.helper( name, function(model)
  {
    return model.fetchAll( callback, context );
  });
};

Factory.grabAll = function(name, callback, context)
{
  return Factory.helper( name, function(model)
  {
    return model.grabAll( callback, context );
  });
};


function ModelFilter()
{
  return function filterModels(models)
  {
    if ( !models || !models.toArray )
    {
      return models;
    }

    var array = models.toArray();
    var ids = {};

    for (var i = 0; i < array.length; i++)
    {
      var model = array[ i ];

      if ( !model.$key || model.$key() in ids )
      {
        array.splice( i--, 1 );
      }
      else
      {
        ids[ model.$key() ] = model;
      }
    }

    return array;
  };
}


  app
    .run( ['$http', InitializeRekord] )
    .filter( 'models', ModelFilter )
  ;

  Rekord.Bind = Bind;
  Rekord.Resolve = Resolve;
  Rekord.Select = Select;
  Rekord.Factory = Factory;
  Rekord.Debugs.ScopeDigest = 100000;

})( angular.module('rekord', []), this, angular, Rekord );