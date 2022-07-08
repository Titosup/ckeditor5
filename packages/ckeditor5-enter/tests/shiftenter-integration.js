/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* global document */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import LinkEditing from '@ckeditor/ckeditor5-link/src/linkediting';
import Delete from '@ckeditor/ckeditor5-typing/src/delete';
import BoldEditing from '@ckeditor/ckeditor5-basic-styles/src/bold/boldediting';
import ShiftEnter from '../src/shiftenter';

import { getData as getModelData, setData as setModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { getData as getViewData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';

describe( 'ShiftEnter integration', () => {
	let editor, model, div;

	const options = { withoutSelection: true };

	beforeEach( () => {
		div = document.createElement( 'div' );
		div.innerHTML = '<p>First line.<br>Second line.</p>';

		document.body.appendChild( div );

		return ClassicEditor.create( div, { plugins: [ Paragraph, ShiftEnter, LinkEditing, Delete, BoldEditing ] } )
			.then( newEditor => {
				editor = newEditor;

				model = editor.model;
			} );
	} );

	afterEach( () => {
		div.remove();

		return editor.destroy();
	} );

	it( 'loads correct data', () => {
		expect( getModelData( model, options ) ).to.equal( '<paragraph>First line.<softBreak></softBreak>Second line.</paragraph>' );
		expect( getViewData( editor.editing.view, options ) ).to.equal( '<p>First line.<br></br>Second line.</p>' );
	} );

	it( 'BLOCK_FILLER should be inserted after <br> in the paragraph', () => {
		setModelData( model, '<paragraph>[]</paragraph>' );

		editor.execute( 'shiftEnter' );

		expect( editor.getData( { trim: 'none' } ) ).to.equal( '<p><br>&nbsp;</p>' );
		expect( editor.ui.view.editable.element.innerHTML ).to.equal( '<p><br><br data-cke-filler="true"></p>' );
	} );

	it( 'should not inherit text attributes before the "softBreak" element', () => {
		setModelData( model,
			'<paragraph>' +
				'<$text linkHref="foo" bold="true">Bolded link</$text>' +
				'<softBreak></softBreak>' +
				'F[]' +
			'</paragraph>'
		);

		editor.execute( 'delete' );

		const selection = model.document.selection;

		expect( selection.hasAttribute( 'linkHref' ) ).to.equal( false );
		expect( selection.hasAttribute( 'bold' ) ).to.equal( false );
	} );

	describe( 'conversion', () => {
		it( 'should convert BR inside text in paragraph', () => {
			editor.setData( '<p>foo<br>bar</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph>foo<softBreak></softBreak>bar</paragraph>'
			);
			expect( editor.getData() ).to.equalMarkup(
				'<p>foo<br>bar</p>'
			);
		} );

		it( 'should convert multiple BRs inside text in paragraph', () => {
			editor.setData( '<p>foo<br><br>bar</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph>foo<softBreak></softBreak><softBreak></softBreak>bar</paragraph>'
			);
			expect( editor.getData() ).to.equalMarkup(
				'<p>foo<br><br>bar</p>'
			);
		} );

		it( 'should convert multiple BRs inside text (outside paragraph)', () => {
			editor.setData( 'foo<br><br>bar' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph>foo<softBreak></softBreak><softBreak></softBreak>bar</paragraph>'
			);
			expect( editor.getData() ).to.equalMarkup(
				'<p>foo<br><br>bar</p>'
			);
		} );

		it( 'should convert BR at the beginning of text in paragraph', () => {
			editor.setData( '<p><br>foo</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph><softBreak></softBreak>foo</paragraph>'
			);
			expect( editor.getData() ).to.equalMarkup(
				'<p><br>foo</p>'
			);
		} );

		it( 'should convert BR at the beginning of text (outside paragraph)', () => {
			editor.setData( '<br>foo' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph><softBreak></softBreak>foo</paragraph>'
			);
			expect( editor.getData() ).to.equalMarkup(
				'<p><br>foo</p>'
			);
		} );

		it( 'should convert BR before a paragraph to a paragraph', () => {
			editor.setData( '<br><p>foo</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph></paragraph><paragraph>foo</paragraph>'
			);
			expect( editor.getData() ).to.equalMarkup(
				'<p>&nbsp;</p><p>foo</p>'
			);
		} );

		it( 'should convert BR after a paragraph to a paragraph', () => {
			editor.setData( '<p>foo</p><br>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph>foo</paragraph><paragraph></paragraph>'
			);
			expect( editor.getData() ).to.equalMarkup(
				'<p>foo</p><p>&nbsp;</p>'
			);
		} );

		it( 'should convert BR between paragraphs to a paragraph', () => {
			editor.setData( '<p>foo</p><br><p>bar</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph>foo</paragraph><paragraph></paragraph><paragraph>bar</paragraph>'
			);
			expect( editor.getData() ).to.equalMarkup(
				'<p>foo</p><p>&nbsp;</p><p>bar</p>'
			);
		} );

		it( 'should convert a single BR', () => {
			editor.setData( '<br>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph><softBreak></softBreak></paragraph>'
			);
			expect( editor.getData( { trim: 'none' } ) ).to.equalMarkup(
				'<p><br>&nbsp;</p>'
			);
		} );

		it( 'should ignore a BR at the end of a block', () => {
			editor.setData( '<p>foo<br></p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph>foo</paragraph>'
			);
			expect( editor.getData( { trim: 'none' } ) ).to.equalMarkup(
				'<p>foo</p>'
			);
		} );

		it( 'should not ignore a BR at the end of a block (wrapped with inline element)', () => {
			editor.setData( '<p><strong>foo<br></strong></p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph><$text bold="true">foo</$text><softBreak></softBreak></paragraph>'
			);
			expect( editor.getData( { trim: 'none' } ) ).to.equalMarkup(
				'<p><strong>foo</strong><br>&nbsp;</p>'
			);
		} );

		it( 'should ignore a BR before a block', () => {
			editor.setData( 'foo<br><p>bar</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph>foo</paragraph><paragraph>bar</paragraph>'
			);
			expect( editor.getData( { trim: 'none' } ) ).to.equalMarkup(
				'<p>foo</p><p>bar</p>'
			);
		} );

		it( 'should ignore a BR before a block (with blocks before)', () => {
			editor.setData( '<p>a</p>foo<br><p>bar</p>' );

			expect( getModelData( model, { withoutSelection: true } ) ).to.equalMarkup(
				'<paragraph>a</paragraph><paragraph>foo</paragraph><paragraph>bar</paragraph>'
			);
			expect( editor.getData( { trim: 'none' } ) ).to.equalMarkup(
				'<p>a</p><p>foo</p><p>bar</p>'
			);
		} );
	} );
} );
