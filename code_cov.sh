#!/bin/bash
./node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha -- -R spec
./node_modules/.bin/istanbul report cobertura --dir shippable/codecoverage
