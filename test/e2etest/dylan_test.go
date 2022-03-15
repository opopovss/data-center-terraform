package e2etest

import (
	"strings"
	"testing"
)

func TestDylan(t *testing.T) {

	//statuscode := 300
	//
	//assert.Regexp(t, "20[01]", strconv.Itoa(statuscode))

	url := "http://aefdad028c5cf43fe8bebd6c81c3ef1e-1693665646.eu-west-2.elb.amazonaws.com/bitbucket"
	//url := "https://bitbucket.e2etest-djptes.deplops.com"

	println(bla(url))

}

func bla(productUrl string) string {
	return strings.Split(productUrl, "/")[2]
}
