const taskinfo = {
    type: 'task', // 'task', 'survey', or 'study'
    uniquestudyid: 'delaydiscount', // unique task id that MUST BE THE SAME as the html file name
    desc: 'delay discounting task staircase with 6 delays', // brief description of task
    condition: null, // experiment/task condition
    redirect_url: "delaydiscount/viz" // set to false if no redirection required
};

const debug = false;  // debug mode to print messages to console and display json data at the end
const fullscreen = false;
const dark_background = true; // if true, white text on black background

// task paramemters
const large_reward = 100; //Large reward after cost.
var costs = [2, 10, 15, 50, 100];  //costs in days.
// var costs = [2, 10]; // I tend to use fewer when debugging (so the task finishes faster)
const trials_per_cost = 6; //Number of trials per cost/delays.

// parameters below typically don't need to be changed
var small_reward = null;  //Small reward without cost.
const quantile_range = [0.40, 0.60] //Quantiles within window to draw values from.
costs = jsPsych.randomization.shuffle(costs);

var n_cost = 0;
var n_trial = 0;
var n_trial_overall = 0;
var reward_window = [0, large_reward];

var reverse_sides = Math.random() > 0.5; // randomly determine whether to switch large/small reward sides
var stimuli_sides = "left_large_right_small";
if (reverse_sides) {
    stimuli_sides = "left_small_right_large";
}

var info_ = create_info_(taskinfo);  // initialize subject id and task parameters
var datasummary_ = create_datasummary_(info_); // initialize datasummary object

// add data to all trials
jsPsych.data.addProperties({
    subject: info_.subject,
    type: taskinfo.type,
    uniquestudyid: taskinfo.uniquestudyid,
    desc: taskinfo.desc,
    condition: taskinfo.condition,
    stimuli_sides: stimuli_sides,
    info_: info_,
    datasummary_: datasummary_
});

if (dark_background) {
    document.body.style.backgroundColor = "black";
    var font_colour = 'white';
} else {
    var font_colour = 'black';
}

var timeline = [];

// check consent (if clicked on agree button, proceed)
var consent = {
    on_start: function () {
        document.body.style.backgroundColor = "white"; // always white background for consent page
    },
    type: 'external-html',
    url: "consent/" + taskinfo.uniquestudyid + ".html",
    cont_btn: "agree_button",
    on_finish: function () {
        if (dark_background) {
            document.body.style.backgroundColor = "black";
        }
    },
}; timeline.push(consent);

if (fullscreen && !debug) {
    timeline.push({
        type: "fullscreen",
        fullscreen_mode: true,
        message: generate_html("The experiment will switch to full screen mode when you press the button below", font_colour)
    });
}

var instructions = {
    type: "instructions",
    pages: [
        generate_html("Welcome!", font_colour, 25, [0, 0]) + generate_html("Click next or press the right arrow key to proceed.", font_colour),
        generate_html("In this task, you'll have to decide which option you prefer.", font_colour) + generate_html("For example, you'll see two options: $30.00 in 3 days or $2.40 in 0 days (today).", font_colour) + generate_html("Choosing $30 days in 3 days means you'll wait 3 days so you can get $30. Choosing $2.40 means you will receive $2.40 today.", font_colour) + generate_html("You'll use the left/right arrow keys on the keyboard to indicate which option you prefer (left or right option, respectively).", font_colour),
        generate_html("Click next or press the right arrow key to begin.", font_colour)
    ],
    show_clickable_nav: true,
    show_page_number: true,
}; timeline.push(instructions);

var trial = {
    type: "html-keyboard-response",
    prompt: generate_html("Press the <b>left</b> or <b>right</b> arrow key to indicate whether <br>you prefer the option on the left or right, respectively.", font_colour, 18, [0, -160]),
    choices: [37, 39],
    timeline: [{
        stimulus: function () {
            var lower = (reward_window[1] - reward_window[0]) * quantile_range[0] + reward_window[0];
            var upper = (reward_window[1] - reward_window[0]) * quantile_range[1] + reward_window[0];
            small_reward = math.random(lower, upper);

            var text_left = "$" + large_reward.toFixed(2) + " in " + costs[n_cost] + " days";
            if (n_trial == 0) { // bold and change color of left option on first trial of each cost/delay
                var text_left = "<b><font color='#317EF3'>" + text_left + "</font></b>"
            };
            var text_or = "&nbsp;&nbsp;&nbsp; or &nbsp;&nbsp;&nbsp;";
            var text_right = "$" + small_reward.toFixed(2) + " in 0 days";
            var text = generate_html(text_left + text_or + text_right, font_colour, 30);
            if (reverse_sides) { // switch left text to right and vice versa
                text = generate_html(text_right + text_or + text_left, font_colour, 30);
            }
            return text;
        },
    }],
    repetitions: trials_per_cost * costs.length,
    on_finish: function (data) {
        data.event = 'choice';
        data.cost = costs[n_cost];
        data.n_cost = n_cost;
        data.large_reward = large_reward;
        data.small_reward = small_reward;
        data.n_trial = n_trial;
        data.n_trial_overall = n_trial_overall;
        data.key_press = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(data.key_press);
        n_trial += 1;
        n_trial_overall += 1;
        if (data.key_press == 'leftarrow') {
            if (reverse_sides) {
                reward_window[1] = small_reward;
                data.choice = 0; // 0: smaller reward chosen, 1: larger reward chosen
            } else {
                reward_window[0] = small_reward;
                data.choice = 1;
            }
        }
        else if (data.key_press == 'rightarrow') {
            if (reverse_sides) {
                reward_window[0] = small_reward;
                data.choice = 1;
            } else {
                reward_window[1] = small_reward;
                data.choice = 0;
            }
        }
        data.reward_window = [reward_window[0], reward_window[1]];
        indifference = (reward_window[0] + reward_window[1]) / 2;
        data.indifference = indifference;
        if (n_trial == trials_per_cost) { // after 5 trials, move to next cost/delay
            n_trial = 0; // reset trial counter
            n_cost += 1;
            reward_window = [0, large_reward]; // reset reward window
        };
        if (debug) {
            console.log('this trial indifference: ' + indifference);
            console.log('next trial cost: ' + costs[n_cost]);
            console.log('next trial reward window: ' + reward_window);
        };
    }
}; timeline.push(trial);


jsPsych.init({
    timeline: timeline,
    on_finish: function () {
        document.body.style.backgroundColor = 'white';
        datasummary_ = summarize_data(); // summarize data
        jsPsych.data.get().addToAll({ // add objects to all trials
            info_: info_,
            datasummary_: datasummary_,
            auc: datasummary_.auc,
            total_time: datasummary_.total_time,
        });
        if (debug) {
            jsPsych.data.displayData();
        }
        sessionStorage.setObj('info_', info_); // save to sessionStorage
        sessionStorage.setObj(info_.datasummary_name, datasummary_); // save to sessionStorage
        submit_data(jsPsych.data.get().json(), taskinfo.redirect_url); // save data to database and redirect
    }
});

// functions to summarize data below
function summarize_data() {
    info_.ABC = 'HEY';
    datasummary_.subject = info_.subject;
    datasummary_.trials_per_cost = trials_per_cost;
    datasummary_.indifference_all = jsPsych.data.get().filter({ event: "choice" }).select('indifference').values;
    datasummary_.cost_all = jsPsych.data.get().filter({ event: "choice" }).select('cost').values;
    datasummary_.auc = get_auc();
    datasummary_.total_time = jsPsych.totalTime();
    return datasummary_;
}

function get_auc() {    //note that this area is an underestimation of the hyperbolic curve, as the width of the histogram bars are bounded by the lower cost and the entry's cost.
    var trial_data = jsPsych.data.get().filter({ n_trial: (trials_per_cost - 1) });
    var indifference_data = trial_data.select('indifference').values;
    var delayed_reward_data = trial_data.select('large_reward').values;
    var cost_data = trial_data.select('cost').values;
    var sorted_costs = cost_data.slice(0, cost_data.length).sort(function (a, b) { return a - b });  // sort a sliced copy of cost_data (try to keep things local as much as we can, so we avoid using the global costs variable) 
    // save in sessionStorage
    datasummary_.indifference = indifference_data;
    datasummary_.delayed_reward = delayed_reward_data;
    datasummary_.cost = cost_data;

    // compute area for each cost
    var bar_areas = [];
    for (i = 0; i < sorted_costs.length; i++) {
        var height = indifference_data[i] / delayed_reward_data[i]; // in this task, elements in delay_reward_data have the same value
        if (sorted_costs.indexOf(cost_data[i]) == 0) { // width of first (leftmost) bar
            var width = cost_data[i] / Math.max(...sorted_costs);
        } else {  // width of the second bar onwards 
            var width = (cost_data[i] - sorted_costs[sorted_costs.indexOf(cost_data[i]) - 1]) / Math.max(...sorted_costs);
        }
        bar_areas.push(width * height);
    }
    if (debug) {
        console.log(bar_areas);
    }
    return bar_areas.reduce(function (a, b) { // sum values in array
        return a + b;
    }, 0);
}