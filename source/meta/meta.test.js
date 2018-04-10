import
{
	update_meta,
	generate_meta_tags_markup
}
from './meta'

import TestDocument from './TestDocument'

describe(`@meta`, () =>
{
	it(`should update meta`, () =>
	{
		const document = new TestDocument
		([
			['charset', 'win1250'],
			['og:locale', 'de'],
			['og:locale', 'fr']
		])

		update_meta
		({
			title        : 'Test',
			description  : 'Testing metadata',
			site_name    : 'Testing',
			locale       : 'ru',
			locale_other : ['en', 'fr'],
			viewport     : 'width=device-width, initial-scale=1',
			keywords     : 'react, redux, webpack',
			author       : '@catamphetamine'
		},
		document)

		document.getMetaTags().should.deep.equal
		([
			['og:locale', 'ru'],
			['og:title', 'Test'],
			['description', 'Testing metadata'],
			['og:description', 'Testing metadata'],
			['og:site_name', 'Testing'],
			['og:locale:alternate', 'en'],
			['og:locale:alternate', 'fr'],
			['viewport', 'width=device-width, initial-scale=1'],
			['keywords', 'react, redux, webpack'],
			['author', '@catamphetamine']
		])

		document.getTitle().should.equal('Test')
	})

	it(`should update meta without title and charset`, () =>
	{
		const document = new TestDocument()
		update_meta({}, document)
		document.getMetaTags().should.deep.equal([])
		expect(document.getTitle()).to.be.undefined
	})

	it(`should update charset`, () =>
	{
		const document = new TestDocument([['charset', 'win1250']])
		update_meta({ charset : 'utf-8' }, document)
		document.getMetaTags().should.deep.equal([['charset', 'utf-8']])
	})

	it(`should skip updating same charset`, () =>
	{
		const document = new TestDocument([['charset', 'utf-8']])
		update_meta({ charset : 'utf-8' }, document)
		document.getMetaTags().should.deep.equal([['charset', 'utf-8']])
	})

	it(`should generate meta tags markup`, () =>
	{
		generate_meta_tags_markup
		({
			charset      : 'utf-8',
			title        : 'Test',
			description  : 'Testing metadata',
			locale       : 'ru',
			locale_other : ['en', 'fr'],
			viewport     : 'width=device-width, initial-scale=1',
			keywords     : 'react, redux, webpack',
			author       : '@catamphetamine'
		})
		.should.deep.equal
		([
			"<meta charset=\"utf-8\"/>",
			"<title>Test</title>",
			"<meta property=\"og:title\" content=\"Test\"/>",
			"<meta name=\"description\" content=\"Testing metadata\"/>",
			"<meta property=\"og:description\" content=\"Testing metadata\"/>",
			"<meta property=\"og:locale\" content=\"ru\"/>",
			"<meta property=\"og:locale:alternate\" content=\"en\"/>",
			"<meta property=\"og:locale:alternate\" content=\"fr\"/>",
			"<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>",
			"<meta name=\"keywords\" content=\"react, redux, webpack\"/>",
			"<meta name=\"author\" content=\"@catamphetamine\"/>"
		])
	})

	it(`should generate meta tags markup with default title and charset`, () =>
	{
		generate_meta_tags_markup({}).should.deep.equal
		([
			"<meta charset=\"utf-8\"/>",
			"<title></title>"
		])
	})
})