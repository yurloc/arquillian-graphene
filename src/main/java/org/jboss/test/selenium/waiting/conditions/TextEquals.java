/*
 * JBoss, Home of Professional Open Source
 * Copyright 2010, Red Hat, Inc. and individual contributors
 * by the @authors tag. See the copyright.txt in the distribution for a
 * full listing of individual contributors.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */
package org.jboss.test.selenium.waiting.conditions;

import org.apache.commons.lang.Validate;
import org.jboss.test.selenium.encapsulated.JavaScript;
import org.jboss.test.selenium.framework.AjaxSelenium;
import org.jboss.test.selenium.framework.internal.Contextual;
import org.jboss.test.selenium.locator.ElementLocator;
import org.jboss.test.selenium.waiting.Condition;
import org.jboss.test.selenium.waiting.JavaScriptCondition;
import static org.jboss.test.selenium.utils.text.LocatorFormat.format;

public class TextEquals implements Condition, JavaScriptCondition, Contextual {
	AjaxSelenium selenium = AjaxSelenium.getCurrentContext(this);
	ElementLocator elementLocator;
	String text;

	public boolean isTrue() {
		Validate.notNull(elementLocator);
		Validate.notNull(text);
		
		return selenium.getText(elementLocator).equals(text);
	}
	
	public JavaScript getJavaScriptCondition() {
        return new JavaScript(format("selenium.getText('{0}') == '{1}'", elementLocator.getAsString(), text));
    }

	protected TextEquals() {
	}
	
	public static IsElementPresent getInstance() {
        return new IsElementPresent();
    }

	public TextEquals locator(ElementLocator elementLocator) {
		Validate.notNull(elementLocator);

		TextEquals copy = copy();
		copy.elementLocator = elementLocator;

		return copy;
	}

	public TextEquals text(String text) {
		Validate.notNull(text);

		TextEquals copy = copy();
		copy.text = text;

		return copy;
	}

	private TextEquals copy() {
		TextEquals copy = new TextEquals();
		copy.elementLocator = elementLocator;
		copy.text = text;
		return copy;
	}
}
