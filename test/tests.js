module( 'NeuroBind' );

var $injector = angular.injector(['ng', 'ngMock', 'neurosync']);

test( 'Database', function(assert)
{
  var done = assert.async();
  var prefix = 'NeurBind_Database_';

  var Task = Neuro({
    name: prefix + 'task',
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  $injector.invoke(function(NeuroBind)
  {
    var $scope = new MockScope();

    strictEqual( $scope.listens, 0 );
    strictEqual( $scope.evals, 0 );

    NeuroBind( $scope, Task );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 0 );

    Task.Database.updated();

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 0 );

    $scope.$destroy();

    strictEqual( $scope.destroys, 1 );

    Task.Database.updated();

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 1 );

    done();
  });

});

test( 'Model', function(assert)
{
  var done = assert.async();
  var prefix = 'NeurBind_Model_';

  var Task = Neuro({
    name: prefix + 'task',
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  $injector.invoke(function(NeuroBind)
  {
    var $scope = new MockScope();

    strictEqual( $scope.listens, 0 );
    strictEqual( $scope.evals, 0 );

    var t0 = Task.create({name: 't0'});

    NeuroBind( $scope, t0 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 0 );

    t0.$save();

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 0 );

    $scope.$destroy();

    strictEqual( $scope.destroys, 1 );

    t0.$save();

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 1 );

    done();
  });

});

test( 'Collection', function(assert)
{
  var done = assert.async();
  var prefix = 'NeurBind_Collection_';

  $injector.invoke(function(NeuroBind)
  {
    var $scope = new MockScope();

    strictEqual( $scope.listens, 0 );
    strictEqual( $scope.evals, 0 );

    var c0 = Neuro.collect(1, 2, 3, 4);

    NeuroBind( $scope, c0 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 0 );

    c0.add( 5 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 0 );

    $scope.$destroy();

    strictEqual( $scope.destroys, 1 );

    c0.add( 6 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 1 );

    done();
  });

});

test( 'Page', function(assert)
{
  var done = assert.async();
  var prefix = 'NeurBind_Page_';

  $injector.invoke(function(NeuroBind)
  {
    var $scope = new MockScope();

    strictEqual( $scope.listens, 0 );
    strictEqual( $scope.evals, 0 );

    var c0 = Neuro.collect(1, 2, 3, 4);
    var p0 = c0.page( 2 );

    NeuroBind( $scope, p0 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 0 );

    c0.add( 5 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 0 );

    p0.next();

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 2 );
    strictEqual( $scope.destroys, 0 );

    $scope.$destroy();

    strictEqual( $scope.destroys, 1 );

    c0.add( 6 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 2 );
    strictEqual( $scope.destroys, 1 );

    done();
  });

});

module( 'NeuroSelect' );

test( 'selectable', function(assert)
{
  var prefix = 'NeuroSelect_selectable_';

  var TaskName = prefix + 'task';
  var Task = Neuro({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var t0 = Task.create({id: '1', name: 't0'});
  var t1 = Task.create({id: '2', name: 't1'});
  var t2 = Task.create({id: '3', name: 't2'});

  var selection = Task.all().selectable( [t1] );

  strictEqual( selection[ t0.id ], void 0 );
  strictEqual( selection[ t1.id ], true );
  strictEqual( selection[ t2.id ], void 0 );

  selection[ t0.id ] = true;
  selection[ t1.id ] = false;
  selection[ t2.id ] = true;

  deepEqual( selection.$selection(), [t0, t2] );

  t0.$remove();

  deepEqual( selection.$selection(), [t2] );
});

module( 'NeuroResolve' );

test( 'NeuroResolve.model', function(assert)
{
  var done = assert.async();
  var prefix = 'NeuroResolve_model_';

  var TaskName = prefix + 'task';
  var Task = Neuro({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var t0 = Task.create({id: 23, name: 't23'});

  expect( 1 );

  $injector.invoke(function($rootScope, NeuroResolve)
  {
    var resolve = NeuroResolve.model( TaskName, 23 );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( t0, resolved );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'NeuroResolve.create save', function(assert)
{
  var done = assert.async();
  var prefix = 'NeuroResolve_create_save_';

  var TaskName = prefix + 'task';
  var Task = Neuro({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  expect( 2 );

  $injector.invoke(function($rootScope, NeuroResolve)
  {
    var resolve = NeuroResolve.create( TaskName, {name: 't0'} );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.name, 't0' );
      strictEqual( resolved.$isSaved(), true );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'NeuroResolve.create dontSave', function(assert)
{
  var done = assert.async();
  var prefix = 'NeuroResolve_create_dontSave_';

  var TaskName = prefix + 'task';
  var Task = Neuro({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  expect( 2 );

  $injector.invoke(function($rootScope, NeuroResolve)
  {
    var resolve = NeuroResolve.create( TaskName, {name: 't0'}, true );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.name, 't0' );
      strictEqual( resolved.$isSaved(), false );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'NeuroResolve.fetch', function(assert)
{
  var done = assert.async();
  var prefix = 'NeuroResolve_fetch_';

  var TaskName = prefix + 'task';
  var Task = Neuro({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.map.put( 45, {id: 45, name: 't45'} );

  expect( 2 );

  $injector.invoke(function($rootScope, NeuroResolve)
  {
    var resolve = NeuroResolve.fetch( TaskName, 45 );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.id, 45 );
      strictEqual( resolved.name, 't45' );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'NeuroResolve.fetch cache', function(assert)
{
  var done = assert.async();
  var prefix = 'NeuroResolve_fetch_cache_';

  var TaskName = prefix + 'task';
  var Task = Neuro({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.map.put( 45, {id: 45, name: 't45'} );

  expect( 4 );

  $injector.invoke(function($rootScope, NeuroResolve)
  {
    var resolve = NeuroResolve.fetch( TaskName, 45 ).cache();
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.id, 45 );
      strictEqual( resolved.name, 't45' );
    });

    $rootScope.$digest();

    remote.map.put( 45, {id: 45, name: 't45Nope' } );
    promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.id, 45 );
      strictEqual( resolved.name, 't45' );

      done();
    });

    $rootScope.$digest();
  });

});

test( 'NeuroResolve.fetch inject', function(assert)
{
  expect( 5 );

  var TestResolved = false;

  angular.module('NeuroResolve.fetch.inject', [])
    .factory('Test', function() {
      return (TestResolved = true);
    })
  ;

  var $injector = angular.injector(['ng', 'ngMock', 'neurosync', 'NeuroResolve.fetch.inject']);

  var done = assert.async();
  var prefix = 'NeuroResolve_fetch_inject_';

  var TaskName = prefix + 'task';
  var Task = Neuro({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.map.put( 45, {id: 45, name: 't45'} );

  $injector.invoke(function($rootScope, NeuroResolve)
  {
    notOk( TestResolved, 'Test Not Yet Resolved' );

    var resolve = NeuroResolve.fetch( TaskName, 45 ).inject('Test');

    notOk( TestResolved, 'Test Still Not Resolved' );

    var promise = $injector.invoke( resolve );

    ok( TestResolved, 'Test Resolved' );

    promise.then(function(resolved)
    {
      strictEqual( resolved.id, 45 );
      strictEqual( resolved.name, 't45' );

      done();
    });

    $rootScope.$digest();
  });

});

test( 'NeuroResolve.fetchAll', function(assert)
{
  var done = assert.async();
  var prefix = 'NeuroResolve_fetchAll_';

  var TaskName = prefix + 'task';
  var Task = Neuro({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.map.put( 45, {id: 45, name: 't45'} );
  remote.map.put( 46, {id: 46, name: 't46'} );

  expect( 5 );

  $injector.invoke(function($rootScope, NeuroResolve)
  {
    var resolve = NeuroResolve.fetchAll( TaskName );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.length, 2 );
      strictEqual( resolved[0].id, 45 );
      strictEqual( resolved[0].name, 't45' );
      strictEqual( resolved[1].id, 46 );
      strictEqual( resolved[1].name, 't46' );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'NeuroResolve.query', function(assert)
{
  var done = assert.async();
  var prefix = 'NeuroResolve_query_';
  var URL = 'http://google.com';

  var TaskName = prefix + 'task';
  var Task = Neuro({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.queries.put( URL, [
    {id: 35, name: 't35'},
    {id: 36, name: 't36'}
  ]);

  expect( 6 );

  $injector.invoke(function($rootScope, NeuroResolve)
  {
    var resolve = NeuroResolve.query( TaskName, URL );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      isInstance( resolved, Neuro.RemoteQuery );

      strictEqual( resolved.length, 2 );
      strictEqual( resolved[0].id, 35 );
      strictEqual( resolved[0].name, 't35' );
      strictEqual( resolved[1].id, 36 );
      strictEqual( resolved[1].name, 't36' );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'NeuroResolve.all', function(assert)
{
  var done = assert.async();
  var prefix = 'NeuroResolve_all_';

  var TaskName = prefix + 'task';
  var Task = Neuro({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var t0 = Task.create({name: 't0'});
  var t1 = Task.create({name: 't1'});
  var t2 = Task.create({name: 't2'});

  expect( 4 );

  $injector.invoke(function($rootScope, NeuroResolve)
  {
    var resolve = NeuroResolve.all( TaskName );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.length, 3 );
      strictEqual( resolved[0], t0 );
      strictEqual( resolved[1], t1 );
      strictEqual( resolved[2], t2 );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'NeuroResolve.where', function(assert)
{
  var done = assert.async();
  var prefix = 'NeuroResolve_where_';

  var TaskName = prefix + 'task';
  var Task = Neuro({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var t0 = Task.create({name: 't0', done: true});
  var t1 = Task.create({name: 't1'});
  var t2 = Task.create({name: 't2', done: true});

  expect( 3 );

  $injector.invoke(function($rootScope, NeuroResolve)
  {
    var resolve = NeuroResolve.where( TaskName, 'done', true );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.length, 2 );
      strictEqual( resolved[0], t0 );
      strictEqual( resolved[1], t2 );

      done();
    });

    $rootScope.$digest();

  });

});
