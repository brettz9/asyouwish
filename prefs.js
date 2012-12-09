{"preferences": 
    [
        {
            "title": "Allowed protocols", 
            "type": "string", 
            "description": "Array (as string) of schemes besides https which are permitted to request privileges.", 
            "value": "[]", 
            "name": "allowedProtocols"
        },
        {
            "title": "Allowed websites", 
            "type": "string", 
            "description": "Array (as string) of websites which are explicitly permitted to request privileges.", 
            "value": "[]", 
            "name": "allowedWebsites"
        },
        {
            "title": "Allowed and approved websites",
            "type": "string",
            "description": "Array (as string) of websites which are explicitly permitted to request privileges and have done so, and user granted them.", 
            "value": "[]",
            "name": "allowedWebsitesApproved"
        },
        {
            "title": "Allow all protocols",
            "type": "bool",
            "description": "Boolean of whether to allow privilege requests to be made from any protocol (and thus any website)",
            "value": false, 
            "name": "allowAllProtocols"
        },
        {
            "title": "Allow all websites whose protocols are approved",
            "type": "bool",
            "description": "Boolean of whether to allow privilege requests to be made from all websites with approved protocols",
            "value": false, 
            "name": "allowAllWebsites"
        }
    ]
}