<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Class Namespace
    |--------------------------------------------------------------------------
    |
    | This value sets the root namespace for Livewire component classes to
    | be discovered by `artisan livewire:discover` in addition to other
    | discoverable areas of your application. You are free to change this.
    |
    | Example: 'App\\Livewire'
    |
    */
    'class_namespace' => 'App\\Livewire',

    /*
    |--------------------------------------------------------------------------
    | Search Path
    |--------------------------------------------------------------------------
    |
    | This value is a/the list of directories where Livewire components will
    | be automatically discovered. By default, the `app/Livewire` directory
    | is searched, but you are free to add your own to the list below.
    |
    */
    'search_path' => [
        app_path('Livewire'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Asset File Path
    |--------------------------------------------------------------------------
    |
    | This value sets the path where Livewire's JavaScript file will be
    | published when you run the `livewire:publish` command. Feel free to
    | change this path to anything your heart desires.
    |
    */
    'asset_url' => '/livewire/livewire.js',

    /*
    |--------------------------------------------------------------------------
    | App URL
    |--------------------------------------------------------------------------
    |
    | This value sets the URL where Livewire will communicate with your app.
    | By default, it will use the default Laravel URL but you are free to
    | override it here for cases where the domain is not automatic.
    |
    */
    'app_url' => env('APP_URL'),

    /*
    |--------------------------------------------------------------------------
    | Middleware (Required)
    |--------------------------------------------------------------------------
    |
    | These Livewire HTTP middleware classes will be applied to every HTTP
    | request that is routed to a Livewire endpoint. You may add your own
    | middleware to this stack if the need ever arises.
    |
    */
    'middleware_class' => 'Livewire\\Http\\Middleware\\HandleRequests',

    /*
    |--------------------------------------------------------------------------
    | Hydrate Route Middleware
    |--------------------------------------------------------------------------
    |
    | These middleware will be applied to the hydrate route which is
    | responsible for processing all updates and new Livewire requests.
    |
    */
    'hydrate_route_middleware' => [],

    /*
    |--------------------------------------------------------------------------
    | Query String Aliases
    |--------------------------------------------------------------------------
    |
    | This array of key/value pairs are aliases made temporary for your view
    | and by default are added to the request during the next request by a
    | counter to show which ones are actually being used vs which ones
    | simply waste cycles through the string.
    |
    */
    'query_string' => [],

    /*
    |--------------------------------------------------------------------------
    | Render On Redirect
    |--------------------------------------------------------------------------
    |
    | This value determines if Livewire routes will be rendered on redirect.
    | typically, only content within a Livewire component is re-rendered and
    | displayed to the client, but if this value is set to true, the entire
    | page (with layout) will also be re-rendered on redirect.
    |
    */
    'render_on_redirect' => false,

    /*
    |--------------------------------------------------------------------------
    | Temporary File Upload Handler
    |--------------------------------------------------------------------------
    |
    | Livewire handles file uploads by storing uploaded files temporarily
    | before they are finalized. All file uploads go through a Livewire
    | endpoint. This value sets the path where those temporary files will
    | be stored. Feel free to customize this path to your liking.
    |
    */
    'temporary_file_upload_handler' => [
        'class' => 'Livewire\\Features\\SupportFileUploads\\TemporaryFileUploadHandler',
    ],

    'temporary_files_disk' => 'local',

    'temporary_files_directory' => 'livewire-tmp',

    /*
    |--------------------------------------------------------------------------
    | Extracted Livewire Script Path
    |--------------------------------------------------------------------------
    |
    | If needed, a Livewire script can be extracted and placed on the path
    | specified here. This is useful in cases where you need to cache the
    | assets in a similar manner to other JavaScript files.
    |
    */
    'script_path' => 'public/livewire',

];
