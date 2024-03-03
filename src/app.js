const site = window.location.hostname

const AddCustomStyle = css => document.head.appendChild(document.createElement("style")).innerHTML = css

function CreateCustomElement(tag, attr_tag, attr_name, value) {
    const custom_element = document.createElement(tag)
    custom_element.setAttribute(attr_tag, attr_name)
    custom_element.innerHTML = value
    document.body.append(custom_element)
}

// CSS Injection
try {
    document.getElementById("sc-name-lbl").innerHTML = document.getElementById("sc-name-lbl").innerHTML + " | ShkoloTweaks v0.0.4"

    chrome.storage.local.get(["theme"], function(result){
        const { theme } = result
        
        if (theme === "dark") {
            AddCustomStyle(`
            html, body, .form-control {
                color: white !important;
                background-color: hsl(0, 0%, 8%) !important;
            }

            label, .stats-label, a, .font-blue-dark, .font-blue-steel,.scheduleTable .scheduleCourse, .scheduleTable .scheduleTableCourse .hourNum, .page-sidebar .page-sidebar-menu>li>a>i, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li>a>i, .page-sidebar .page-sidebar-menu>li.open>a, .page-sidebar .page-sidebar-menu>li:hover>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li.open>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li:hover>a, .page-sidebar .page-sidebar-menu>li>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li>a, .page-sidebar .page-sidebar-menu li>a>.arrow.open:before, .page-sidebar .page-sidebar-menu li>a>.arrow:before, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu li>a>.arrow.open:before, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu li>a>.arrow:before, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li:hover>a>i, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li>a:hover>i, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li>a>i, .page-sidebar .page-sidebar-menu .sub-menu>li>a>i, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu .sub-menu>li>a>i, .page-sidebar .menu-title, .page-sidebar .page-sidebar-menu .sub-menu>li>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu .sub-menu>li>a {
                color: white !important;
            }

            /* Darker Darker bg */
            .badge-success {
                background-color: hsl(0, 0%, 4%) !inportant;
            }
            

            /* Darker bg */
            .page-header.navbar, .page-sidebar, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover, .nav>li>a:focus, .nav>li>a:hover {
                background-color: hsl(0, 0%, 8%) !important;
                color: white;
            }

            /* Dark bg */
            .page-content, .portlet.portlet-sortable.light, .highcharts-background, .portlet.light, .grade, .page-sidebar .page-sidebar-menu>li.open>a, .page-sidebar .page-sidebar-menu>li:hover>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li.open>a, .page-sidebar-closed.page-sidebar-fixed .page-sidebar:hover .page-sidebar-menu>li:hover>a, .page-header.navbar .hor-menu.hor-menu-light .navbar-nav>li .dropdown-menu {
                background-color: hsl(0, 0%, 15%) !important;
                color: white;
            }

            /* Light Dark bg */
            .taken-shi, .pagination>.active>a, .pagination>.active>a:focus, .pagination>.active>a:hover, .pagination>.active>span, .pagination>.active>span:focus, .pagination>.active>span:hover {
                background-color: hsl(0, 0%, 22%) !important;
            }

            /* Hover for Text */
            .grade:hover {
                color: hsl(0, 0%, 80%);
            }
            
            /* Transparent bg */
            .pagination > li > a.clr1:not(.active), .pagination > li > a.clr2:not(.active), .pagination > li > a.clr2:not(.active), .pagination > li > a.clr3:not(.active),.pagination > li > a.clr4:not(.active), .pagination > li > a.clr5:not(.active), .pagination > li > a.clr6:not(.active), .pagination > li > a.clr7:not(.active), .pagination>li>a, .pagination>li>span {
                background-color: rgba(0, 0, 0, 0) !important;
            }

            /* Odd List Items Color */
            .table-striped>tbody>tr:nth-of-type(odd) {
                background-color: hsl(0, 0%, 17%);
                color: white;
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

            .btn-info, .btn.green:not(.btn-outline) {
                background-color: hsl(0, 0%, 15%);
                border-color: hsl(0, 0%, 90%);
            }

            .btn-info:hover, .btn.green:not(.btn-outline):hover {
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
            `)
        }
        console.log(theme)
    })
} catch (error) {
    console.log("[ShkoloTweaks] Error injecting CSS:\n" + error)
}
