'use strict'

//todo 时间存timestamp？有些字段存keyword和text两种？_all enable？
//      用ik来进行中文分词？

export const dynamic_templates = [
    {
        "message_field": {
            "mapping": {
                "omit_norms": true,
                "type": "text"
            },
            "match": "Content", //original content 不分词
            "match_mapping_type": "string"
        }
    },
    {
        "date_field": {
            "mapping": {
                "type": "date",
                // "format": "epoch_millis"
            },
            "match": "*At",
            "match_mapping_type": "long"
        }
    },
    {
        "time_field": {
            "mapping": {
                "type": "date",
                // "format": "yyy-MM-dd HH:mm:ss"
                "format": "epoch_second"
            },
            "match": "*Time",
            "match_mapping_type": "long"
        }
    },
    {
        "string_fields": {
            "match": "*",
            "match_mapping_type": "string",
            "mapping": {
                "ignore_above": 256,
                "type": "keyword"
            },
        }
    }
]
