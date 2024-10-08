export const intervalSchema = {
    schema: {
        type: 'object',
        title: 'Set period values card settings',
        properties: {
            interval: {
                title: 'Interval',
                type: 'string',
                default: 'hour so far'
            }
        },
        required: []
    },
    form: [
        "interval"
    ]
}