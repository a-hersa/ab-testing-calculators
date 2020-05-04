/* Keep one accordion open */
jQuery(function($){
  $('[data-toggle=collapse]').on('click', function (e) {
      e.preventDefault();
      if(! $(this).hasClass('collapsed')){
          e.stopPropagation();
          return false;
      }
  });
});
 
 /*document.addEventListener("input", updateInput);*/
$( "#button-copy-traffic" ).click(function() {
    $( "#total-traffic" ).val($( "#sample-size" ).html()*2);
    $( "#split-slider" ).html($('#split-value').val() + "%" );
    totalTraffic = parseInt($( "#total-traffic" ).val(), 10);
    dailyTraffic = parseInt($( "#daily-traffic" ).val(), 10);
    split = $( "#split-value" ).val() / 100;
    periodRaw = $( "input:radio[name=period]:checked" ).val();
    period = parseFloat(periodRaw, 10);
    calculateTestDuration();
  });

$(function() {
    $("body").on("input", function(e) {
      if (e.target.id == "input-1" || $(e.target).parents("#input-1").length) {
        $( "#power-slider" ).html($('#power-value').val() + "%" );
        baseCR = $( "#base-cr" ).val() / 100;
        mde = $( "#min-effect" ).val() / 100;
        beta = (100 - $( "#power-value" ).val()) / 100;
        alphaRaw = $( "input:radio[name=significance-level]:checked" ).val();
        alpha = parseFloat(alphaRaw, 10);
        calculateSampleSize();
      }
      if (e.target.id == "input-2" || $(e.target).parents("#input-2").length) {
        $( "#split-slider" ).html($('#split-value').val() + "%" );
        totalTraffic = parseInt($( "#total-traffic" ).val(), 10);
        dailyTraffic = parseInt($( "#daily-traffic" ).val(), 10);
        split = $( "#split-value" ).val() / 100;
        periodRaw = $( "input:radio[name=period]:checked" ).val();
        period = parseFloat(periodRaw, 10);
        calculateTestDuration();
      }
      if (e.target.id == "input-3" || $(e.target).parents("#input-3").length) {
        alphaSanityRaw = $( "input:radio[name=significance-level-sanity]:checked" ).val();
        alphaSanity = parseFloat(alphaSanityRaw, 10);
        if ($( "#button1").attr("aria-expanded") == "true") {
          $( "#split-slider-checker" ).html($('#split-value-checker').val() + "%" );
          splitChecker = $( "#split-value-checker" ).val() / 100;
          countControl = parseInt($( "#countControl" ).val(), 10);
          countExp = parseInt($( "#countExp" ).val(), 10);
          calculateCheckCount();
        } else {
          probControlPageviews = parseInt($( "#probControlPageviews" ).val(), 10);
          probControlTraffic = parseInt($( "#probControlTraffic" ).val(), 10);
          probExpPageviews = parseInt($( "#probExpPageviews" ).val(), 10);
          probExpTraffic = parseInt($( "#probExpTraffic" ).val(), 10);
          calculateCheckProbability();
        }
      }
      if (e.target.id == "input-4" || $(e.target).parents("#input-4").length) {
        testControlTraffic = parseInt($( "#testControlTraffic" ).val(), 10);
        testControlConversions = parseInt($( "#testControlConversions" ).val(), 10);
        testExpTraffic = parseInt($( "#testExpTraffic" ).val(), 10);
        testExpConversions = parseInt($( "#testExpConversions" ).val(), 10);
        testAlphaRaw = $( "input:radio[name=test-significance-level]:checked" ).val();
        testAlpha = parseFloat(testAlphaRaw, 10);
        calculateTestResults();
      }
    });
  })

function calculateTestResults() {
    testControlProbability = testControlConversions / testControlTraffic;
    testExpProbability = testExpConversions / testExpTraffic;
    testPPooled = (testControlConversions + testExpConversions) / (testControlTraffic + testExpTraffic);
    testSdpooled = Math.sqrt(testPPooled*(1-testPPooled)*(1/testControlTraffic+1/testExpTraffic));
    testME = parseFloat(round(getZScore(0.5-testAlpha/2)*testSdpooled, 4));
    testDifference = parseFloat(round(testExpProbability-testControlProbability, 4));
    testLowerLimit = testDifference-testME;
    testUpperLimit = testDifference+testME;
    console.log("The change due to the experiment is",testDifference*100,"%");
    console.log("Confidence Interval: [",testDifference-testME,",",testDifference+testME,"]");
    console.log("The change is statistically significant if the CI doesn't include 0. In that case, it is practically significant if",-testMde,"is not in the CI as well.");
    showTestResults();
}

function showTestResults() {
  if (testLowerLimit <= 0 && testUpperLimit >= 0) {
    $( "#output-4-results" ).html("The change due to the experiment is"+testDifference*100+"% but the change is not statistically significant.");
  }  else {
    $( "#output-4-results" ).html("The change due to the experiment is"+testDifference*100+"% but the change is statistically significant.");
  }
}

function calculateCheckProbability() {
    probControlTotal = probControlTraffic / probControlPageviews;
    probExpTotal = probExpTraffic / probExpPageviews;
    dHatSanity = round(probExpTotal - probControlTotal, 5);
    pPooledSanity = parseFloat(round((probControlTraffic + probExpTraffic)/(probControlPageviews + probExpPageviews), 5), 10);
    sdPooledSanity = round(Math.sqrt(pPooledSanity*(1-pPooledSanity)*(1/probControlPageviews+1/probExpPageviews)), 5);
    ME = parseFloat(round(getZScore(0.5-(alphaSanity/2))*sdPooledSanity,5), 10);
    showCheckProbability();
}

function showCheckProbability() {
    if (dHatSanity >= 0-ME && dHatSanity <= 0+ME) {
      $( "#output-3-results" ).html("The difference between ("+round(probControlTotal, 2)+"%) and ("+round(probExpTotal, 2)+"%) is whithin an expected range and there is no significant difference. Metric split seems to be done correctly.");
    }  else {
      $( "#output-3-results" ).html("The difference between ("+round(probControlTotal, 2)+"%) and ("+round(probExpTotal, 2)+"%) is outisde the expected range and there are significant differences. Metric split seems to be done incorrectly");
    }
}

function calculateCheckCount() {
    countTotal = countControl + countExp;
    pHatSanity = round(countControl/(countTotal),5);
    sdSanity = round(Math.sqrt(splitChecker*(1-splitChecker)/(countTotal)), 5);
    ME = parseFloat(round(getZScore(0.5-(alphaSanity/2))*sdSanity,5), 10);
    countLowerLimit = round(splitChecker - ME, 5);
    countUpperLimit = round(splitChecker + ME, 5);
    showCheckCount();
}

function showCheckCount() {
    if (pHatSanity >= countLowerLimit && pHatSanity <= countUpperLimit) {
      $( "#output-3-results" ).html("The difference between "+countTotal+" and "+countExp+" is whithin an expected range and there is no significant difference. Metric split seems to be done correctly.");
    }  else {
      $( "#output-3-results" ).html("The difference between "+countTotal+" and "+countExp+" is outisde the expected range and there are significant differences. Metric split seems to be done incorrectly");
    }
}

function calculateTestDuration() {
    totalDaysAll = Math.ceil(totalTraffic/(dailyTraffic * split));
    totalMonths = Math.floor(totalDaysAll / 28);
    totalWeeks = Math.floor((totalDaysAll - (totalMonths * 28)) /7);
    totalDays = Math.floor((totalDaysAll - (totalMonths * 28) - (totalWeeks * 7)));
    practicalTraffic = Math.ceil(totalDaysAll * (dailyTraffic * split));
    showTestDuration();
}

function showTestDuration() {
    $( "#total-days-all" ).html(totalDaysAll);
    $( "#split-result" ).html(Math.round((split * 100)) + "%");
    $( "#total-months" ).html(totalMonths);
    $( "#total-weeks" ).html(totalWeeks);
    $( "#total-days" ).html(totalDays);
    $( "#practical-traffic" ).html(practicalTraffic);

}

function calculateSampleSize() {
    getSDS(baseCR, mde);
    getSampleSize(sds, alpha, beta, mde);

    showSampleSize();
}

function showSampleSize() {
    $( "#sample-size" ).html(sampleSize);
}

function getSDS(baseCR, mde) {
    sd1 = Math.sqrt(2*baseCR*(1-baseCR));
    sd2 = Math.sqrt(baseCR*(1-baseCR)+(baseCR+mde)*(1-(baseCR+mde)));
    sds = [sd1, sd2];
    return sds
}

function getSD(baseCR, n) {
    sd = round(Math.sqrt((baseCR*(1-baseCR))/n), 4);
    return sd
}

function getSampleSize(sds, alpha, beta, d) {
    sampleSize = round(Math.pow((getZScore(0.5-alpha/2)*sds[0]+getZScore(0.5-beta)*sds[1]),2)/Math.pow(d,2),0);
    return sampleSize
}
/*  
def get_sampSize(sds,alpha,beta,d):
    n=pow((get_z_score(1-alpha/2)*sds[0]+get_z_score(1-beta)*sds[1]),2)/pow(d,2)
    return n

*/

function round(num, dec){
    if ((typeof num !== 'number') || (typeof dec !== 'number')) 
        return false; 
    var num_sign = num >= 0 ? 1 : -1;   
    return (Math.round((num*Math.pow(10,dec))+(num_sign*0.0001))/Math.pow(10,dec)).toFixed(dec);
  }

function getZScore(p) {
    var a0= 2.5066282,  a1=-18.6150006,  a2= 41.3911977,   a3=-25.4410605,
        b1=-8.4735109,  b2= 23.0833674,  b3=-21.0622410,   b4=  3.1308291,
        c0=-2.7871893,  c1= -2.2979648,  c2=  4.8501413,   c3=  2.3212128,
        d1= 3.5438892,  d2=  1.6370678, r, z;

    if (p>0.42) {
        r=Math.sqrt(-Math.log(0.5-p));
        z=(((c3*r+c2)*r+c1)*r+c0)/((d2*r+d1)*r+1);
    } else {
        r=p*p;
        z=p*(((a3*r+a2)*r+a1)*r+a0)/((((b4*r+b3)*r+b2)*r+b1)*r+1);
    }
    return z;
}