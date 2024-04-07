const manifest = chrome.runtime.getManifest()

const version = manifest.version

const AddCustomStyle = css => document.head.appendChild(document.createElement("style")).innerHTML = css

function removeElements(elements) {
    Array.from(elements).forEach(function (element) {
        element.remove()
    })
}

// CSS Injection
try {
    document.getElementById("sc-name-lbl").innerHTML = document.getElementById("sc-name-lbl").innerHTML + " | ShkoloTweaks v" + version + " (Beta)";
    document.getElementsByClassName("page-footer-inner")[0].innerHTML = document.getElementsByClassName("page-footer-inner")[0].innerHTML + " | ShkoloTweaks е създадено от екип <b>ITPG Studios</b> и е софтуер, който не е свързан или одобрен от Shkolo.bg.";

    chrome.storage.local.get(["theme", "cleanUp", "blurPfp", "rounded"], function(result){
        const { theme, cleanUp, blurPfp, rounded } = result
        
        if (theme === "dark") {
            AddCustomStyle(`
            html, body, .form-control {
                color: white !important;
                background-color: hsl(0, 0%, 8%) !important;
            }

            label, .stats-label, a, tspan, .font-blue-dark, .font-blue-steel,.scheduleTable .scheduleCourse, .scheduleTable .scheduleTableCourse .hourNum, .page-sidebar .page-sidebar-menu>li>a>i, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li>a>i, .page-sidebar .page-sidebar-menu>li.open>a, .page-sidebar .page-sidebar-menu>li:hover>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li.open>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li:hover>a, .page-sidebar .page-sidebar-menu>li>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li>a, .page-sidebar .page-sidebar-menu li>a>.arrow.open:before, .page-sidebar .page-sidebar-menu li>a>.arrow:before, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu li>a>.arrow.open:before, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu li>a>.arrow:before, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li:hover>a>i, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li>a:hover>i, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li>a>i, .page-sidebar .page-sidebar-menu .sub-menu>li>a>i, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu .sub-menu>li>a>i, .page-sidebar .menu-title, .page-sidebar .page-sidebar-menu .sub-menu>li>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu .sub-menu>li>a, .note.note-warning, .page-header.navbar .top-menu .navbar-nav>li.dropdown .dropdown-toggle>i, .message-table-head > div, .message-user, .message-subject, .scroll-to-top>i, .btn-default, .dataTables_wrapper .dataTables_length, .dataTables_wrapper .dataTables_filter, .dataTables_wrapper .dataTables_info, .dataTables_wrapper .dataTables_processing, .dataTables_wrapper .dataTables_paginate, .highcharts-menu-item, .note.note-info, .page-header.navbar .top-menu .navbar-nav>li.dropdown-extended .dropdown-menu>li.external>h3, span, p {
                color: white !important;
            }
            
            /* Darker bg */
            .page-header.navbar, .page-sidebar, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover, .nav>li>a:focus, .nav>li>a:hover, .dropdown-menu>li>a:focus, .dropdown-menu>li>a:hover, .note-editor.note-frame .note-editing-area .note-editable, .panel-default>.panel-heading, .filtersContainer, .table-hover>tbody>tr:hover, .table-hover>tbody>tr:hover>td, .content-comment-section .content-comment, div.dt-button-collection, .select2-container--default .select2-selection--multiple .select2-selection__choice {
                background-color: hsl(0, 0%, 8%) !important;
                color: white;
            }

            /* Dark bg */
            .page-content, .portlet.portlet-sortable.light, .highcharts-background, .portlet.light, .page-sidebar .page-sidebar-menu>li.open>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li.open>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li:hover>a, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li .dropdown-menu, .detailsRow, .table-hover > tbody > tr.detailsRow:hover, .table-hover > tbody > tr.detailsRow:hover > td, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li:hover>a, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li>a:hover, .page-header.navbar .hor-menu.hor-menu-light.year-selector .navbar-nav > li.open > a, .page-header.navbar .hor-menu.hor-menu-light.app-switcher .navbar-nav > li.open > a, .messageThread, .panel, .dropdown-menu, .modal-content, .dropdown-menu>li.active:hover>a, .dropdown-menu>li.active>a, .dropdown-menu>li:hover>a, .inbox-folder-options-btn, .inbox-folder-options-btn:focus, .inbox-folder-options-btn.focus, .inbox-folder-options-btn:active, .inbox-folder-options-btn.active, .open > .dropdown-toggle.inbox-folder-options-btn, .empty-cell:hover, .table-hover > tbody > tr:hover > td.empty-cell, .empty-cell, .bootstrap-select.btn-group .no-results, table.dataTable tbody tr, .bg-default, .page-header.navbar .top-menu .navbar-nav>li.dropdown-notification .dropdown-menu .dropdown-menu-list>li>a .time, .page-sidebar .page-sidebar-menu>li:hover>a, .note-btn:hover, .note-btn:hover, .panel-heading.note-toolbar .note-color .note-btn-group:hover > .note-btn, .panel-heading.note-toolbar .note-color .note-btn-group:hover > .note-btn, .note-popover .popover-content .note-color .dropdown-menu .note-palette .note-color-reset, .panel-heading.note-toolbar .note-color .dropdown-menu .note-palette .note-color-reset, .note-popover .popover-content .note-color .dropdown-menu .note-palette .note-color-select, .panel-heading.note-toolbar .note-color .dropdown-menu .note-palette .note-color-select, .bg-white {
                background-color: hsl(0, 0%, 15%) !important;
                color: white !important;
            }

            /* Light Dark bg */
            .taken-shi, .pagination>.active>a, .pagination>.active>a:focus, .pagination>.active>a:hover, .pagination>.active>span, .pagination>.active>span:focus, .pagination>.active>span:hover, .inbox-content .timeline .timeline-body, .btn.default:not(.btn-outline), .btn-default, .stats-ranking-table .highlight, .page-header.navbar .top-menu .navbar-nav>li.dropdown-extended .dropdown-menu>li.external, .highcharts-menu, .popupText, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li .dropdown-menu li:hover>a, .page-header.navbar .top-menu .navbar-nav>li.dropdown-extended .dropdown-menu .dropdown-menu-list>li>a:hover, .profile-usermenu ul li.active a, .note.note-info, a.dt-button.buttons-columnVisibility.active:not(.disabled), .select2-container--default.select2-container--focus .select2-selection--multiple, .select2-container--default .select2-selection--multiple, .select2-dropdown, .dropzone {
                background-color: hsl(0, 0%, 22%) !important;
                color: white !important;
            }

            /* Hover for Text */
            .grade:hover {
                color: hsl(0, 0%, 80%);
            }
            
            /* Transparent bg */
            .pagination > li > a.clr1:not(.active), .pagination > li > a.clr2:not(.active), .pagination > li > a.clr2:not(.active), .pagination > li > a.clr3:not(.active),.pagination > li > a.clr4:not(.active), .pagination > li > a.clr5:not(.active), .pagination > li > a.clr6:not(.active), .pagination > li > a.clr7:not(.active), .pagination>li>a, .pagination>li>span, .portlet .portlet-title.is_stuck {
                background-color: rgba(0, 0, 0, 0) !important;
            }
            
            /* Odd List Items Color */
            .table-striped>tbody>tr:nth-of-type(odd) {
                background-color: hsl(0, 0%, 17%);
                color: white;
            }

            .table-striped>tbody>tr:nth-of-type(odd):hover {
                background-color: hsl(0, 0%, 10%);
            }

            .grade, .btn.green-haze:not(.btn-outline), .dashboard-stat .details .number, .dashboard-stat .details .desc, .table td, .table th {
                font-weight: bold;
            }

            .classWorkGrade {
                border: 2px solid white !important;
            }
            
            .highcharts-background {
                fill: hsl(0, 0%, 15%);
                color: white;
            }

            .scheduleTable .scheduleTableCell:hover {
                background-color: hsl(0, 0%, 10%);
            }

            .nav-tabs>li.active>a, .nav-tabs>li.active>a:focus, .nav-tabs>li.active>a:hover {
                color: white;
                background-color: hsl(0, 0%, 15%);
            }

            .btn-info, .btn.green:not(.btn-outline), a.dt-button.buttons-columnVisibility.active:not(.disabled) {
                background-color: hsl(0, 0%, 15%);
                border-color: hsl(0, 0%, 90%);
            }

            .btn-info:hover, .btn.green:not(.btn-outline):hover, .btn-info.active, .btn-info:active, .btn-info.focus, .btn-info:focus, .btn-info.active.focus, .btn-info.active:focus, .btn-info.active:hover, .btn-info:active.focus, .btn-info:active:focus, .btn-info:active:hover, .open>.btn-info.dropdown-toggle.focus, .open>.btn-info.dropdown-toggle:focus, .open>.btn-info.dropdown-toggle:hover, .btn.green:not(.btn-outline).active.focus, .btn.green:not(.btn-outline).active:focus, .btn.green:not(.btn-outline).active:hover, .btn.green:not(.btn-outline):active.focus, .btn.green:not(.btn-outline):active:focus, .btn.green:not(.btn-outline):active:hover, .open>.btn.green:not(.btn-outline).dropdown-toggle.focus, .open>.btn.green:not(.btn-outline).dropdown-toggle:focus, .open>.btn.green:not(.btn-outline).dropdown-toggle:hover, .btn.green:not(.btn-outline).active, .btn.green:not(.btn-outline):active, .btn.green:not(.btn-outline).focus, .btn.green:not(.btn-outline):focus{
                background-color: hsl(0, 0%, 4%);
                border-color: white;
            }

            .page-sidebar .page-sidebar-menu>li>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li>a {
                border-top: 1px solid #ffffff;
            }

            .page-sidebar .page-sidebar-menu .sub-menu>li.active>a, .page-sidebar .page-sidebar-menu .sub-menu>li.open>a, .page-sidebar .page-sidebar-menu .sub-menu>li:hover>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu .sub-menu>li.active>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu .sub-menu>li.open>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu .sub-menu>li:hover>a {
                background: #262626 !important;
            }

            .pagination>.active>a, .pagination>.active>a:focus, .pagination>.active>a:hover, .pagination>.active>span, .pagination>.active>span:focus, .pagination>.active>span:hover {
                border-color: hsl(0, 0%, 90%);
            }

            .dashboard-stat.blue, .label-success {
                background-color: #095082 !important;
            }

            .dashboard-stat.green {
                background-color: #19757d !important;
            }

            .dashboard-stat.red, .btn.red:not(.btn-outline) {
                background-color: #912a31;
            }

            .dashboard-stat.yellow, .label-warning {
                background-color: #96772f;
            }

            .dashboard-stat.purple {
                background-color: #7a3796;
            }

            .dashboard-stat.green-jungle {
                background-color: #196545;
            }

            .portlet>.portlet-title {
                border-bottom: 0;
            }

            .inbox .inbox-nav>li>a:hover {
                background-color: #383838;
            }

            .highcharts-scrollbar-track {
                fill: hsl(0, 0%, 15%) !important;
                stroke: hsl(0, 0%, 15%) !important;
            }

            .highcharts-scrollbar-thumb {
                fill: hsl(0, 0%, 8%) !important;
                stroke: hsl(0, 0%, 8%) !important;
            }

            .highcharts-scrollbar-button {
                fill: hsl(0, 0%, 22%) !important;
                stroke: hsl(0, 0%, 22%) !important;
            }

            tspan {
                fill: white !important;
                stroke: none !important;
            }

            .highcharts-button {
                fill: hsl(0, 0%, 22%) !important;
                stroke: hsl(0, 0%, 22%) !important;
            }

            .highcharts-root text {
                fill: white !important;
                stroke: none !important;
                font-weight: bold;
                color: white !important;
            }

            .badge-success {
                background-color: #0b5259;
            }

            .badge {
                font-weight: bold;
                font-size: 12px;
            }

            .detailsRow.absenceType2 {
                background-color: #8d850c !important;
                border-color: transparent !important;
            }

            .detailsRow.absenceType1 {
                background-color: #1b3b2c !important;
                border-color: transparent !important;
            }

            .detailsRow.absenceType3, .badges-type-2 .badge-details-holder {
                background-color: #f1484bc2 !important;
                border-color: transparent !important;
            }

            .badges-type-2, .badges-type-2:hover, .pupil-badge-type.remark {
                background-color: #262626 !important;
                border-color: #9a4040 !important;
            }

            .badges-type-1, .badges-type-1:hover, .pupil-badge-type.appraisal {
                background-color: #262626 !important;
                border-color: #c0ff8e !important;
            }

            .badges-type-1 .badge-details-holder {
                background: #748f60;
                border-top: 1px solid #c0ff8e;
            }

            .rating:not(:hover) > input:checked ~ label, .rating > label:hover, .rating > label:hover ~ label {
                color: #ffd700 !important;
            }

            .mt-element-ribbon .ribbon.ribbon-color-success>.ribbon-sub {
                background-color: #1e7279;
            }

            .page-sidebar .page-sidebar-menu>li.active:hover>a, .page-sidebar .page-sidebar-menu>li.active>a {
                background: #912a31 !important;
            }

            .input-group-addon {
                background-color: #fff0;
                border: 0;
            }

            .cc_container {
                background: hsl(0, 0%, 15%) !important;
            }

            .popupText::before {
                border-color: transparent transparent #383838 transparent;
            }
            `)
        }

        if (cleanUp) {
            var statsBtn = document.getElementsByClassName("btn btn-lg btn-e2e red huge")
            removeElements(statsBtn)
    
            var rankDescr = document.getElementsByClassName("rank-descr")
            removeElements(rankDescr)
    
            var mobileappbadges = document.getElementsByClassName("mobile-app-badges")
            removeElements(mobileappbadges)
    
            var mobileapplink = document.getElementsByClassName("mobile-app-link")
            removeElements(mobileapplink)
    
            document.getElementById("help-link-in-menu").remove()

            var dropdownmenulist = document.getElementsByClassName("dropdown-menu-list scroller")

            for (var i = 0; i < dropdownmenulist.length; i++) {
                dropdownmenulist[i].style = "height: 310px !important;" 
            }

            AddCustomStyle(`
            .page-header.navbar .top-menu .navbar-nav>li.dropdown-extended .dropdown-menu {
                max-height: 400px !important;
                min-height: 361px !important;
            }

            .profile-userpic img.avatar {
                width: 150px;
                height: 150px;
            }

            .select2-container, .inbox-compose .controls>input {
                margin-bottom: 4px !important;
                margin-top: 4px !important;
            }

            .nav-item, .page-sidebar .page-sidebar-menu .sub-menu li > a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu .sub-menu li > a {
                margin: 5px !important;
            }

            .portlet>.portlet-title>.caption, .inbox-nav-folder .inbox-nav-folder-info .inbox-nav-folder-name {
                font-weight: bold;
            }

            `)
        }

        if(blurPfp) {
            AddCustomStyle(`
            .page-header.navbar .top-menu .navbar-nav>li.dropdown-user .dropdown-toggle>img, .inbox-content .timeline .timeline-badge-userpic {
                filter: blur(3px);
                transition: all 0.4s;
            }

            .profile-userpic img.avatar {
                filter: blur(5px);
                transition: all 0.4s;
            }

            .profile-userpic img.avatar:hover {
                filter: blur(0);
            }

            .page-header.navbar .top-menu .navbar-nav>li.dropdown-user .dropdown-toggle>img:hover, .inbox-content .timeline .timeline-badge-userpic:hover {
                filter: blur(0);
            }


            .username {
                filter: blur(5px);
                transition: all 0.4s;

                &:hover {
                    filter: blur(0);
                }
            }


            .form-group > div.col-sm-6 > p.form-control-static {
                filter: blur(5px);
                transition: all 0.4s;

                &:hover {
                    filter: blur(0);
                }
            }

            .profile-usertitle-name {
                filter: blur(5px);
                transition: all 0.4s;

                &:hover {
                    filter: blur(0);
                }
            }



            `)
        }

        if (rounded) {
            AddCustomStyle(`
            .btn:not(.btn-sm):not(.btn-lg), .portlet.portlet-sortable.light, .dashboard-stat, .btn.green:not(.btn-outline), .popupText, .highcharts-menu, .btn.red:not(.btn-outline), .page-header.navbar .top-menu .navbar-nav>li.dropdown-notification .dropdown-menu .dropdown-menu-list>li>a .time, .dropdown-menu, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li .dropdown-menu li:hover>a, .page-header.navbar .top-menu .navbar-nav>li.dropdown-extended .dropdown-menu>li.external, .note.note-info, .btn.blue:not(.btn-outline), .form-control, .modal-content, .label, .alert-info, .page-sidebar .page-sidebar-menu>li.active>a, .dropdown-menu>li>a:hover, .iradio_square-blue, div.dt-button-collection, a.dt-button.buttons-columnVisibility.active:not(.disabled), div.dt-button-collection button.dt-button, div.dt-button-collection div.dt-button, div.dt-button-collection a.dt-button, .inbox .inbox-body, .inbox .inbox-sidebar, .new-message-recipients-box > span > span > span, .select2-dropdown, .select2-container--default .select2-selection--multiple .select2-selection__choice, .page-sidebar .page-sidebar-menu .sub-menu li > a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu .sub-menu li > a, .profile-usermenu ul li.active a, .profile-usermenu ul li a:hover, .filtersContainer, .cc_container {
                border-radius: 8px !important;
            }

            rect {
                rx: 8px;
            }

            .nav-item > a {
                border-radius: 8px !important;
                border: 0 !important;
            }

            /* Top */
            .nav-tabs>li.active>a, .nav-tabs>li.active>a:focus, .nav-tabs>li.active>a:hover, .nav-tabs>li>a:hover, .scheduleTable .scheduleTableHeading {
                border-radius: 8px 8px 0 0 !important;
            }

            /* Bottom */
            .page-content {
                border-radius: 0 0 8px 8px !important;
            }

            /* Left */
            .pagination>li:first-child>a, .pagination>li:first-child>span {
                border-radius: 8px 0 0 8px !important;
            }

            /* Right */
            .pagination>li:last-child>a, .pagination>li:last-child>span {
                border-radius: 0 8px 8px 0 !important;
            }

            .input-group-addon {
                background-color: #fff0;
                border: 0;
            }

            #tableGrades, #tableAbsences, #tableFeedbacks {
                border-collapse: unset !important;
            }   

            #tab_control_test > .portlet > table {
                border-radius: 20px !important;
                border-collapse: unset !important;
            }

            #tab_control_test > .portlet > table > thead > tr > .thinTableColumn {
                border-left: 0 !important;
                border-right: 0 !important;
            }

            #tab_control_test > .portlet > .table > tbody > .compactTableRow > td {
                border-left: 0 !important;
                border-bottom: 0 !important;
                border-right: 0 !important;
            }

            #tab_control_test > .portlet > .table > thead > .tableHeadersFooters > .col-md-4 {
                border-left: 0 !important;
            }

            #tab_parent_meeting > .portlet > table {
                border-radius: 20px !important;
                border-collapse: unset !important;
            }

            #tab_parent_meeting > .portlet > table > thead > tr > .thinTableColumn {
                border-left: 0 !important;
                border-right: 0 !important;
            }

            #tab_parent_meeting > .portlet > .table > tbody > .compactTableRow > td {
                border-left: 0 !important;
                border-bottom: 0 !important;
                border-right: 0 !important;
            }

            #tab_parent_meeting > .portlet > .table > thead > .tableHeadersFooters > .col-md-4 {
                border-left: 0 !important;
            }

            .annualAssessment {
                border-left: 0 !important;
                border-right: 0 !important;
            }

            #tableAbsences > thead > tr > .thinTableColumn {
                border-left: 0 !important;
                border-right: 0 !important;
            }

            #tableFeedbacks > thead > tr > .thinTableColumn {
                border-left: 0 !important;
                border-right: 0 !important;
            }

            #tableGrades:not(#tableGrades >  *), #tableAbsences:not(#tableAbsences >  *), #tableFeedbacks:not(#tableFeedbacks >  *) {
                border-radius: 20px !important;
            }

            .big, tfoot .annualAssessment.solid-left-border, thead .thinTableColumn:first-of-type, .numVal:not(.term1):not(.term2):not(.solid-left-border) .thinTableColumn {
                border: 0 !important;
            }

            .scheduleTableColumn {
                padding: 3px;
            }

            .scheduleTableBody .scheduleTableCell:last-child {
                border-bottom-right-radius: 8px !important;
                border-bottom-left-radius: 8px !important;
            }

            .profile-usermenu ul li {
                border-bottom: none !important;
                margin: 5px !important;
            }

            .inbox .inbox-nav>li>a {
                border-radius: 8px !important;
                margin-top: 3px !important;
                margin-bottom: 3px !important;
            }

            .inbox .inbox-nav > li.active > a {
                border: none !important;
                background-color: hsl(0, 0%, 22%) !important;
            }

            .message-table-head > div:first-child {
                border-radius: 8px 0 0 8px !important;
                margin-bottom: 5px !important;
            }

            .message-table-head > div:last-child {
                border-radius: 0 8px 8px 0 !important;
            }
            
            .messageThread {
                border: none !important;
            }

            .messageThread:hover {
                background-color: hsl(0, 0%, 22%) !important;
                border-radius: 8px !important;
            }

            .profile-usermenu ul li.active a, .profile-usermenu ul li a {
                border: none !important;
            }

            .onOffSwitch-handle, .onOffSwitch {
                border-radius: 20px !important;
            }

            .btn-group>.btn:first-child:not(:last-child):not(.dropdown-toggle) {
                border-radius: 8px 0 0 8px !important;
            }

            .btn-group>.btn:last-child:not(:first-child), .btn-group>.btn:not(:first-child):not(:last-child) {
                border-radius: 0 8px 8px 0 !important;
            }

            `)
        }
    })
} catch (error) {
    console.log("[ShkoloTweaks] Error injecting CSS:\n" + error)
}
