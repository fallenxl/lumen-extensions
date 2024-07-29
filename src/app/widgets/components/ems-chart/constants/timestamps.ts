export const RESOLUTIONS = [
    // {
    //     id: 1,
    //     name: "1 minute",
    //     ts: 60000,
    //     maxInterval: 3600000,
    //     defaultChecked: true,
    //     agg: 'minute',

    //     aggType: 'NONE'
    // },
    {
        id: 2,
        name: "2 minutes",
        ts: 120000,
        maxInterval: 7200000,
        agg: 'minute',
        aggType: 'NONE'
    },
    {
        id:10,
        name: "5 minutes",
        ts: 300000,
        maxInterval: 18000000,
        agg: 'minute'
    },
    {
        id: 3,
        name: "15 minutes",
        ts: 900000,
        maxInterval: 54000000,
        agg: 'minute'
    },
    {
        id: 4,
        name: "30 minutes",
        ts: 1800000,
        maxInterval: 108000000,
        agg: 'minute'
    },
    {
        id: 5,
        name: "1 hour",
        ts: 3600000,
        maxInterval: 216000000,
        agg: 'hour'
    },
    {
        id:6,
        name: "2 hours",
        ts: 7200000,
        maxInterval: 432000000,
        agg: 'hour'
    },
    {
        id: 7,
        name: "1 day",
        ts: 86400000,
        maxInterval: 604800000,
        agg: 'day'
    }
]

export const INTERVALS = [
    {
        id: 10,
        name: "Last hour so far",
        startDate: new Date(new Date().setMinutes(0, 0, 0)).setHours(new Date().getHours()),
        endDate: new Date().setMinutes(59, 59, 999),
        toString: function () {
            return `${new Date(this.startDate).toLocaleTimeString()} - ${new Date(this.endDate).toLocaleTimeString()}`
        },
        minResolution: 2,
        defaultResolution: 10,
        minGrid: 40,
        agg: 'minute',
        minZoom: 0,
        fillData: true,
        condition: 10
    },
    {
        id: 11,
        name: "Last hour",
        startDate: new Date().setMinutes(0, 0, 0) - 3600000,
        endDate: new Date().setMinutes(0, 0, 0),
        toString: function () {
            return `${new Date(this.startDate).toLocaleTimeString()} - ${new Date(this.endDate).toLocaleTimeString()}`
        },
        minResolution: 2,
        defaultResolution: 10,
        minGrid: 40,
        agg: 'minute',
        minZoom:0,
        condition: 10
    },
    {
        id: 1,
        name: "Today",
        startDate: new Date().setHours(0, 0, 0, 0),
        endDate: new Date().setHours(23, 59, 59, 999),
        toString: function () {
            return  `Today, ${new Date(this.startDate).toLocaleTimeString()} - ${new Date(this.endDate).toLocaleTimeString()}`
        },
        minResolution: 2,
        defaultResolution: 5,
        minGrid: 200,
        agg: 'hour',
        minZoom:0,
        condition: 10,
        fillData: true
    },
    {
        id: 2,
        name: "Yesterday",
        startDate: new Date().setHours(0, 0, 0, 0) - 86400000,
        endDate: new Date().setHours(23, 59, 59, 999) - 86400000,
        toString: function () {
            return `Yesterday, ${new Date(this.startDate).toLocaleTimeString()} - ${new Date(this.endDate).toLocaleTimeString()}`
        },
        minResolution: 2,
        defaultResolution: 5,
        minGrid: 200,
        agg: 'hour',
        minZoom: 0,
        condition: 10
    },
    {
        id: 3,
        name: "This week",
        startDate: new Date().setHours(0, 0, 0, 0) - new Date().getDay() * 86400000,
        endDate: new Date().setHours(23, 59, 59, 999),
        toString: function () {
            return `${new Date(this.startDate).toDateString()} - ${new Date(this.endDate).toDateString()}`
        },
        minResolution: 4,
        defaultResolution: 6,
        minGrid: 200,
        agg: 'hour',
        minZoom: 0,
        fillData: true
    },
    {
        id: 4,
        name: "Last week",
        startDate: new Date().setHours(0, 0, 0, 0) - (new Date().getDay() + 7) * 86400000,
        endDate: new Date().setHours(23, 59, 59, 999) - new Date().getDay() * 86400000,
        toString: function () {
            return `${new Date(this.startDate).toDateString()} - ${new Date(this.endDate).toDateString()}`
        },
        minResolution: 4,
        defaultResolution: 6,
        minGrid: 200,
        agg: 'hour',
        minZoom: 0
    },
    {
        id: 5,
        name: "Last 7 days",
        startDate: new Date().setHours(0, 0, 0, 0) - 7 * 86400000,
        endDate: new Date().setHours(23, 59, 59, 999),
        toString: function () {
            return `${new Date(this.startDate).toDateString()} - ${new Date(this.endDate).toDateString()}`
        },
        minResolution: 4,
        defaultResolution: 6,
        minGrid: 200,
        agg: 'hour',
        minZoom: 0
    }, {
        id: 6,
        name: "This month",
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).setHours(0, 0, 0, 0),
        endDate: new Date().setHours(23, 59, 59, 999),
        toString: function () {
            return `${new Date(this.startDate).toDateString()} - ${new Date(this.endDate).toDateString()}`
        },
        minResolution: 6,
        defaultResolution: 6,
        minGrid: 60,
        agg: 'day',
        minZoom: 0

    }, {
        id: 7,
        name: "Last month",
        startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).setHours(0, 0, 0, 0),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).setHours(23, 59, 59, 999),
        toString: function () {
            return `${new Date(this.startDate).toDateString()} - ${new Date(this.endDate).toDateString()}`
        },
        minResolution: 6,
        defaultResolution: 6,
        minGrid: 60,
        agg: 'day',
        minZoom: 0
    }, {
        id: 8,
        name: "Last 30 days",
        startDate: new Date().setHours(0, 0, 0, 0) - 30 * 86400000,
        endDate: new Date().setHours(23, 59, 59, 999),
        toString: function () {
            return `${new Date(this.startDate).toDateString()} - ${new Date(this.endDate).toDateString()}`
        },
        minResolution: 6,
        defaultResolution: 6,
        minGrid:40,
        agg: 'day',
        minZoom: 0
    },
    {
        id: 9,
        name: "Year to date",
        startDate: new Date(new Date().getFullYear(), 0, 1).setHours(0, 0, 0, 0),
        endDate: new Date().setHours(23, 59, 59, 999),
        toString: function () {
            return `${new Date(this.startDate).toDateString()} - ${new Date(this.endDate).toDateString()}`
        },
        minResolution: 7,
        defaultResolution: 7,
        minGrid: 50,
        agg: 'day',
        minZoom: 0

    },
    // {
    //     id: 10,
    //     name: "This year",
    //     startDate: new Date(new Date().getFullYear(), 0, 1).setHours(0, 0, 0, 0),
    //     endDate: new Date().setHours(23, 59, 59, 999),
    //     toString: function () {
    //         return `${new Date(this.startDate).toDateString()} - ${new Date(this.endDate).toDateString()}`
    //     },
    //     defaultResolution: 7,
    //     minGrid: 50,
    //     agg: 'day',
    //     minZoom: 0,
    //     fillData: true
    // }
]