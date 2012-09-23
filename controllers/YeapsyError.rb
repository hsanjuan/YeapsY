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

# Describes an error in YeapsY
class YeapsyError

    # Default message is returned to the user if DEBUG is set to false
    DEFAULT_MSG = "An internal server error has ocurred. Contact administrator for more information"
    DEBUG = false
    LOGGING = true

    if LOGGING
        Dir.mkdir('logs') unless File.exist?('logs')
        LOGGER = Logger.new('logs/errors.log', 'monthly')
    end

    def initialize(title, message, return_code = 500)
        error = "#{title}: #{message}. Code #{return_code}"
        
        if LOGGING
            LOGGER.error(error)
        else
            warn error
        end
            
        @title = title
        if return_code == 500
            @message = DEBUG ? message : DEFAULT_MSG
        else
            @message = message
        end
        @return_code = return_code
    end

    # Return the an array with the error code and the JSON for the error
    # This is passed directly to Sinatra, so the correct state is set
    def to_json
        [@return_code, {:title => @title, :message => @message}.to_json]
    end

    # Some standard error types

    # Forbidden
    def self.forbidden(operation)
        YeapsyError.new('Forbidden',
                        "Not allowed to #{operation}.", 403)
    end

    # Not found
    def self.nonexistent(resource)
        YeapsyError.new('Error', 
                        "The resource does not exist (#{resource})", 404)
    end
end
