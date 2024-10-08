
/**
 * Alarms   
   "Leakage alarm",
    "Burst Alarm",
    "Tamper Alarm",
    "Freezing Alarm",
    "Low battery Alarm",
    "Empty Pipe Alarm",
    "Reverse Flow Alarm",
    "Over Range Alarm",
    "Over Temperature Alarm",
    "EEPROM Error"
 */

    export const ALARMS = {
        "Leakage alarm": {
            name: "Leakage alarm",
            description: "Leak detected",
            icon: 'check_box_outline_blank',
            color: 'yellow'
        },
        "Burst Alarm": {
            name: "Burst Alarm",
            description: "Burst Alarm",
            icon: 'check_box_outline_blank',
            color: 'red'
        },
        "Tamper Alarm": {
            name: "Tamper Alarm",
            description: "Tamper Alarm",
            icon: 'check_box_outline_blank',
            color: 'red'
        },
        "Freezing Alarm": {
            name: "Freezing Alarm",
            description: "Freezing Alarm",
            icon: 'check_box_outline_blank',
            color: 'red'
        },
        "Low battery Alarm": {
            name: "Low battery Alarm",
            description: "Low battery Alarm",
            icon: 'mdi:battery-low',
            color: 'rgb(156,39,176)'
        },
        "Empty Pipe Alarm": {
            name: "Empty Pipe Alarm",
            description: "No water flow detected",
            icon: 'check_box_outline_blank',
            color: 'rgb(245,221,0)'
        },
        "Reverse Flow Alarm": {
            name: "Reverse Flow Alarm",
            description: "Flow in the reverse direction",
            icon: 'mdi:share-off',
            color: 'rgb(244,67,54)'
        },
        "Over Range Alarm": {
            name: "Over Range Alarm",
            description: "Over Range Alarm",
            icon: 'check_box_outline_blank',
            color: 'red'
        },
        "Over Temperature Alarm": {
            name: "Over Temperature Alarm",
            description: "High temperature detected",
            icon: 'check_box_outline_blank',
            color: 'red'
        },
        "EEPROM Error": {
            name: "EEPROM Error",
            description: "EEPROM Error",
            icon: 'check_box_outline_blank',
            color: 'red'
        }
    }
