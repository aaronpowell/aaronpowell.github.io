param location string = resourceGroup().location

param swaName string
@allowed([ 'Free', 'Standard' ])
param swaSku string = 'Free'

module staticWebApp 'swa.bicep' = {
    name: '${deployment().name}--swa'
    params: {
        location: location
        sku: swaSku
        name: swaName
    }
}
