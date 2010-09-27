mkdir	:= mkdir -p
rm		:= rm -rf
m4		:= m4
closure	:= closure


.PHONY: all
all: dist/nabtext.min.js dist/jquery.nabtext.min.js


dist:
	$(mkdir) dist

# nabtext
dist/nabtext.js: dist src/nabtext.core.js src/nabtext.js
	$(m4) -I src src/nabtext.js > $@

dist/nabtext.min.js: dist/nabtext.js
	$(closure) --js dist/nabtext.js --js_output_file $@

# jquery.nabtext
dist/jquery.nabtext.js: dist src/nabtext.core.js src/jquery.nabtext.js
	$(m4) -I src src/jquery.nabtext.js > $@

dist/jquery.nabtext.min.js: dist/jquery.nabtext.js
	$(closure) --js dist/jquery.nabtext.js --js_output_file $@


.PHONY: clean
clean:
	$(rm) dist