use serde::{Deserialize, Serialize};
use reqwest::Client;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NotionConfig {
    pub token: String,
    pub database_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotionPage {
    pub id: String,
    pub title: String,
    pub last_edited_time: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotionBlock {
    pub id: String,
    pub block_type: String,
    pub content: serde_json::Value,
}

#[derive(Clone)]
pub struct NotionClient {
    client: Client,
    config: NotionConfig,
}

impl NotionClient {
    pub fn new(config: NotionConfig) -> Self {
        Self {
            client: Client::new(),
            config,
        }
    }

    pub fn is_configured(&self) -> bool {
        !self.config.token.is_empty()
    }

    /// List all pages in the database
    pub async fn list_pages(&self) -> Result<Vec<NotionPage>, String> {
        let db_id = match &self.config.database_id {
            Some(id) => id,
            None => return Err("No database configured".to_string()),
        };

        let url = format!("https://api.notion.com/v1/databases/{}/query", db_id);
        let resp = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.config.token))
            .header("Notion-Version", "2022-06-28")
            .header("Content-Type", "application/json")
            .json(&serde_json::json!({}))
            .send()
            .await
            .map_err(|e| format!("Notion API error: {}", e))?;

        let body: serde_json::Value = resp.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let results = body["results"].as_array().ok_or("No results")?;
        let pages = results.iter().filter_map(|r| {
            let id = r["id"].as_str()?.to_string();
            let title = r["properties"]["title"]["title"][0]["plain_text"]
                .as_str()
                .unwrap_or("Untitled")
                .to_string();
            let last_edited = r["last_edited_time"].as_str().unwrap_or("").to_string();
            let url = r["url"].as_str().unwrap_or("").to_string();
            Some(NotionPage { id, title, last_edited_time: last_edited, url })
        }).collect();
        Ok(pages)
    }

    /// Create a page in the database
    pub async fn create_page(&self, title: &str, content: &str) -> Result<NotionPage, String> {
        let db_id = match &self.config.database_id {
            Some(id) => id,
            None => return Err("No database configured".to_string()),
        };

        let body = serde_json::json!({
            "parent": { "database_id": db_id },
            "properties": {
                "title": {
                    "title": [{ "text": { "content": title } }]
                }
            },
            "children": [
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{ "type": "text", "text": { "content": content } }]
                    }
                }
            ]
        });

        let resp = self.client
            .post("https://api.notion.com/v1/pages")
            .header("Authorization", format!("Bearer {}", self.config.token))
            .header("Notion-Version", "2022-06-28")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Notion API error: {}", e))?;

        let body: serde_json::Value = resp.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let id = body["id"].as_str().ok_or("No id in response")?.to_string();
        let url = body["url"].as_str().unwrap_or("").to_string();
        Ok(NotionPage {
            id,
            title: title.to_string(),
            last_edited_time: chrono::Utc::now().to_rfc3339(),
            url,
        })
    }

    /// Update page content
    pub async fn update_page(&self, page_id: &str, title: &str, content: &str) -> Result<(), String> {
        // Update title
        let title_body = serde_json::json!({
            "properties": {
                "title": {
                    "title": [{ "text": { "content": title } }]
                }
            }
        });
        self.client
            .patch(&format!("https://api.notion.com/v1/pages/{}", page_id))
            .header("Authorization", format!("Bearer {}", self.config.token))
            .header("Notion-Version", "2022-06-28")
            .json(&title_body)
            .send()
            .await
            .map_err(|e| format!("Notion API error: {}", e))?;

        // Delete existing blocks
        let blocks_resp = self.client
            .get(&format!("https://api.notion.com/v1/blocks/{}/children", page_id))
            .header("Authorization", format!("Bearer {}", self.config.token))
            .header("Notion-Version", "2022-06-28")
            .send()
            .await
            .map_err(|e| format!("Notion API error: {}", e))?;

        let blocks_body: serde_json::Value = blocks_resp.json().await
            .map_err(|e| format!("Failed to parse: {}", e))?;

        if let Some(blocks) = blocks_body["results"].as_array() {
            for block in blocks {
                if let Some(block_id) = block["id"].as_str() {
                    self.client
                        .delete(&format!("https://api.notion.com/v1/blocks/{}", block_id))
                        .header("Authorization", format!("Bearer {}", self.config.token))
                        .header("Notion-Version", "2022-06-28")
                        .send()
                        .await
                        .ok();
                }
            }
        }

        // Add new content
        let content_body = serde_json::json!({
            "children": [
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{ "type": "text", "text": { "content": content } }]
                    }
                }
            ]
        });
        self.client
            .patch(&format!("https://api.notion.com/v1/blocks/{}/children", page_id))
            .header("Authorization", format!("Bearer {}", self.config.token))
            .header("Notion-Version", "2022-06-28")
            .json(&content_body)
            .send()
            .await
            .map_err(|e| format!("Notion API error: {}", e))?;

        Ok(())
    }

    /// Delete a page (archive)
    pub async fn delete_page(&self, page_id: &str) -> Result<(), String> {
        let body = serde_json::json!({ "archived": true });
        self.client
            .patch(&format!("https://api.notion.com/v1/pages/{}", page_id))
            .header("Authorization", format!("Bearer {}", self.config.token))
            .header("Notion-Version", "2022-06-28")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Notion API error: {}", e))?;
        Ok(())
    }

    /// Verify token by fetching user info
    pub async fn verify_token(&self) -> Result<String, String> {
        let resp = self.client
            .get("https://api.notion.com/v1/users/me")
            .header("Authorization", format!("Bearer {}", self.config.token))
            .header("Notion-Version", "2022-06-28")
            .send()
            .await
            .map_err(|e| format!("Notion API error: {}", e))?;

        let body: serde_json::Value = resp.json().await
            .map_err(|e| format!("Failed to parse: {}", e))?;

        let name = body["name"].as_str().unwrap_or("Notion User").to_string();
        Ok(name)
    }
}