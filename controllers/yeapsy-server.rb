# -*- coding: utf-8 -*-

###############################################################################
#     Copyright © 2012 Hector Sanjuan                                         #
#                                                                             #
#     This file is part of Yeapsy.                                            #
#                                                                             #
#     Yeapsy is free software: you can redistribute it and/or modify          #
#     it under the terms of the GNU General Public License as published by    #
#     the Free Software Foundation, either version 3 of the License, or       #
#     (at your option) any later version.                                     #
#                                                                             #
#     Yeapsy is distributed in the hope that it will be useful,               #
#     but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#     GNU General Public License for more details.                            #
#                                                                             #
#     You should have received a copy of the GNU General Public License       #
#     along with Yeapsy.  If not, see <http://www.gnu.org/licenses/>.         #
#                                                                             #
###############################################################################

YEAPSY_VERSION = "0.1.9"

BASE_DIR = File.join(File.dirname(__FILE__), '..')
CHANGELOG = File.join(BASE_DIR, 'CHANGELOG')
CONFIG_FILE = File.join(BASE_DIR, 'config', 'yeapsy-config.yaml')

require 'rubygems'
require 'sinatra/base'
require 'json'
require 'yaml'
require 'haml'
require 'sequel'
require 'warden'
require 'controllers/Yeapsy.rb'
require 'controllers/YeapsyDB.rb'
require 'controllers/YeapsyAuth.rb' #sets up warden
require 'controllers/YeapsyMail.rb'

# Sinatra application. This class handles the initialization of the application
# and basic logic related to requests. Complex logic is handled by Yeapsy class.
class YeapsyServer < Sinatra::Base

    configure do

        # Read configuration and init database
        begin
            config = File.read(CONFIG_FILE)
            config = YAML::load(config)
            yeapsy_db = YeapsyDB.new(config)
            database = yeapsy_db.connect()
        rescue => e
            warn e.message
            warn e.backtrace.join("\n")
            exit 1
        end

        set :root, BASE_DIR
        set :environment, config[:environment].to_sym
        set :db, database # keep database accessible
        set :yeapsy_config, config
        set :mail, YeapsyMail.new(config) # Init mail. Used to send emails.
        set :haml, :format => :html5

        # Only when the database has been initialized we can load the models
        # Alternative option is using Schema plugin so that schema can be
        # defined inside the models
        require 'models/User'
        require 'models/Event'
        require 'models/Application'
        require 'models/Evaluation'
        Yeapsy.setup(config) #sets up initial user if needed

        # Use cookie-based sessions
        secret = yeapsy_config[:secret] || "yyyeapsyyy"
        use Rack::Session::Cookie, :secret => secret,:expire_after => 2700
    end

    # Helpers

    helpers do

        def public_route?(method, path)
            public_routes = [ #these pass bypass authentication
                             ['GET' , '/'],
                             ['GET' , 'y'],
                             ['GET' , 'changelog'],
                             ['POST', 'login'],
                             ['POST', 'logout'],
                             ['GET' , 'logout'],
                             ['POST', 'register'],
                             ['POST', 'reminder'],
                             ['GET' , 'tos'],
                             ['GET' , 'privacy']
                            ]

            route = path == '/' ? [method, '/'] : [method, path.split('/')[1]]

            return public_routes.include?(route)
        end

    end

    before do
        # Cache directive
        cache_control :public, :must_revalidate, :max_age => 600 #10 mins
        content_type 'application/json'

        # If request is not for a public path
        # Check if we are authenticated, otherwise halt
        # When authenticated
        #  - No cache
        #  - Set useful vars
        #  - Instantiate Yeapsy
        pass if public_route?(request.request_method, request.path_info)

        if !env['warden'].authenticated?
            halt 401
        else #this code runs normally all the time on authenticated requests
            cache_control :no_cache

            # Extract some configuration values that are interesting
            # to keep in @Yeapsy object
            interesting_cfg = [:activity_watch]
            interesting_cfg = interesting_cfg.collect do |key|
                [key, settings.yeapsy_config[key]]
            end
            interesting_cfg = Hash[interesting_cfg]

            @user_name = env['warden'].user[:username]
            @user_id = env['warden'].user[:id]
            @rank = env['warden'].user[:rank]
            @Yeapsy = Yeapsy.new(settings.db,
                                 @user_id,
                                 @user_name,
                                 @rank,
                                 settings.mail,
                                 interesting_cfg)
        end
    end

    # After method will send an email to administrator when a 500 error
    # has happened. Unfortunately, it is not possible to email the body
    # of this error since it has not been set yet at this stage
    after do
        if response.status == 500
            settings.mail.send(nil,nil,"Yeapsy status 500 detected",
                               "You may want to look at the logs...")
        end
    end

    ###########################################################################
    # Routes
    ###########################################################################

    get '/' do
        content_type 'text/html'
        haml :index
    end

    get '/changelog' do
        content_type 'text/plain'
        begin
            File.read(CHANGELOG)
        rescue
            YeapsyError.new("Error",
                            "Could not read changelog", 500).to_json
        end
    end

    # Provides the information for the logged in user.
    # Used as a way to check if the client is authenticated.
    get '/credentials' do
        cache_control :no_cache
        [200, {
             :username => env['warden'].user[:username],
             :user_id => env['warden'].user[:id],
             :rank => env['warden'].user[:rank],
             :email => env['warden'].user[:email]
         }.to_json
        ]
    end

    # When login is successful credentials are returned
    post '/login' do
        auth = env['warden'].authenticate(:password)
        if auth
            user = User[auth[:id]]
            user.last_login = Time.now
            user.save_changes
            [200, {
                 :username => user.username,
                 :user_id => user.id,
                 :rank => user.rank,
                 :email => user.email}.to_json]
        else
            YeapsyError.new('Authentication failed',
                            'Wrong username or password',403).to_json
        end
    end

    post '/logout' do
        env['warden'].logout
    end

    get '/logout' do
        env['warden'].logout
        redirect '/'
    end

    # An email is sent with the feedback message to the contact address
    post '/feedback' do
        begin

            contact = settings.yeapsy_config[:contact]
            user_email = User[@user_id].email
            message = Yeapsy.parse_json(request.body.read)[:feedback]

            mail.send(contact,
                      contact,
                      "Yeapsy feedback from #{user_email}",
                      message)
            204
        rescue => e
            return YeapsyError.new('An error occurred',
                                   'Cannot send email',500).to_json
        end
    end

    post '/register' do
        Yeapsy.register(request.body.read, settings.mail,
                        settings.yeapsy_config[:activity_watch])
    end

    post '/reminder' do
        Yeapsy.reminder(request.body.read, settings.mail)
    end

    get '/y/event/:id' do
        cache_control :no_cache
        content_type 'text/html'
        begin
            id = params[:id]
            @event = Event[id]
            if !@event
                @error = "Event not found. Check provided ID"
                return [404, haml(:error_event, :layout => :layout_simple)]
            end

            if !env['warden'].authenticated?
                # Not authorised, try to provide event
                if @event.state != YeapsyEvent::EVENT_ST[:call_leaders] &&
                        @event.state != YeapsyEvent::EVENT_ST[:open]
                    @error = "This event is not currently published. "
                    @error << "Please login to see the event information "
                    @error << "if you are involved in this "
                    @error << "event as administrator, "
                    @error << "leader, applicant or participant."
                    return [403, haml(:error_event, :layout => :layout_simple)]
                else
                    haml :event_info, :layout => :layout_simple
                end
            else
                redirect to("/#event_info+#{id}")
            end

        rescue => e
            puts e.backtrace
            return YeapsyError.new("Error retrieving event info",
                                   e.message, 500).to_json
        end
    end

    get '/tos' do
        content_type 'text/html'
        begin
            haml :_ToS, :layout => :layout_simple
        rescue
            [404, haml(:error404, layout => :layout_simple)]
        end
    end

    get '/privacy' do
        content_type 'text/html'
        begin
            haml :privacy_policy, :layout => :layout_simple
        rescue
            [404, haml(:error404, layout => :layout_simple)]
        end
    end

    # Routes for YEAPSY resources

    get '/:resource' do
        @Yeapsy.list(params[:resource])
    end

    get '/event/:id/application' do
        @Yeapsy.get_event_applications(params[:id].to_i)
    end

    get '/event/:id/application/:app_id' do
        @Yeapsy.get_event_application(params[:id].to_i,
                                      params[:app_id].to_i)
    end

    put '/event/:id/application/:app_id' do
        @Yeapsy.modify_event_application(params[:id].to_i,
                                         params[:app_id].to_i,
                                         request.body.read)
    end

    get '/:resource/:id' do
        @Yeapsy.get(params[:resource],params[:id].to_i)
    end

    post '/:resource' do
        @Yeapsy.create(params[:resource],request.body.read)
    end

    put '/:resource/:id' do
        @Yeapsy.modify(params[:resource],params[:id].to_i,request.body.read)
    end

    delete '/user/:id' do
        user_id = params[:id].to_i
        rc = @Yeapsy.delete('user', user_id)
        env['warden'].logout if user_id == env['warden'].user[:id]
        rc
    end

    delete '/:resource/:id' do
        @Yeapsy.delete(params[:resource],params[:id].to_i)
    end

    not_found do
        content_type 'text/html'
        haml :error404, :layout => :layout_simple
    end
end
