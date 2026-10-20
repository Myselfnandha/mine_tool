package com.minenotes.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.minenotes.R

/**
 * Mine Notes AppWidgetProvider
 * Enables taking quick notes, links, and audio notes directly from the Android Home Screen
 * without opening the full application window.
 */
class MineNotesWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_QUICK_CAPTURE = "com.minenotes.action.QUICK_CAPTURE"
        const val ACTION_VOICE_CAPTURE = "com.minenotes.action.VOICE_CAPTURE"
        const val EXTRA_PAYLOAD_TEXT = "extra_payload_text"
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.widget_quick_note)

        // Intent to capture note silently via background service
        val captureIntent = Intent(context, MineNotesWidgetService::class.java).apply {
            action = ACTION_QUICK_CAPTURE
        }
        val pendingCapture = PendingIntent.getService(
            context,
            0,
            captureIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_input_box, pendingCapture)

        // Intent for instant mic capture
        val micIntent = Intent(context, MineNotesWidgetService::class.java).apply {
            action = ACTION_VOICE_CAPTURE
        }
        val pendingMic = PendingIntent.getService(
            context,
            1,
            micIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_btn_mic, pendingMic)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
